import os
import re
import io
import warnings
import pandas as pd
import uuid # Used to generate unique filenames for uploaded images
import base64 # Used for decoding base64 image data
import time # Used for generating unique barcodes if needed

from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
from utils.inventory import load_inventory, save_inventory, get_alerts
from utils.orders import load_orders, save_orders, create_order
from utils.barcode import lookup_barcode
from utils.analysis import process_data
import requests
from datetime import datetime
import csv
warnings.filterwarnings('ignore')

app = Flask(__name__)
app.config['INVENTORY_FILE'] = "data/inventory.csv"
app.config['ORDERS_FILE'] = "data/orders.csv"
# Updated ALLOWED_EXTS to explicitly include image types
app.config['ALLOWED_EXTS'] = {'csv','xlsx','xls','json','tsv','pdf','png','jpg','jpeg','gif'}

# Define the folder where product images will be uploaded
# It will be inside your static directory: static/images/products/
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'images', 'products')

# Ensure the upload directory exists when the application starts
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    """
    Checks if a given filename has an allowed extension based on app.config['ALLOWED_EXTS'].
    This now correctly handles image file extensions as well.
    """
    return '.' in filename and filename.rsplit('.',1)[1].lower() in app.config['ALLOWED_EXTS']

def fuzzy_column_match(col, aliases):
    def normalize(s):
        return re.sub(r'[^a-z0-9]', '', s.lower())
    cn = normalize(col)
    return any(cn == normalize(a) for a in aliases)

@app.route('/inventory/count', methods=['GET'])
def inventory_count():
    """
    Returns the entire inventory as a JSON list of product dictionaries.
    Handles NaN values by replacing them with empty strings.
    """
    df = load_inventory(app.config['INVENTORY_FILE'])
    # Replace NaN with an empty string (or another valid value, like 0 or null)
    df = df.fillna('')
    return jsonify(df.to_dict(orient='records'))


@app.route('/inventory/search', methods=['GET'])
def inventory_search():
    """
    Searches the inventory based on a query string (barcode, name, or category).
    Returns a JSON list of matching products, including their image_url.
    If no query, returns all products.
    """
    q = request.args.get('q', '').strip().lower()
    df = load_inventory(app.config['INVENTORY_FILE'])

    try:
        if not q:
            return jsonify(df.fillna('').to_dict(orient='records'))

        # Search by barcode first (exact match for numeric barcodes)
        # Ensure barcode column is treated as string for consistent comparison
        if q.isdigit(): # If query is purely numeric, assume it's a barcode
            results = df[df['barcode'].astype(str) == q]
            if not results.empty:
                return jsonify(results.fillna('').to_dict(orient='records'))

        # If not found by exact barcode, or query is not numeric, search by name (contains)
        # Fallback to searching by name if barcode lookup fails or query is not a barcode
        results = df[df['name'].str.lower().str.contains(q, na=False)]
        return jsonify(results.fillna('').to_dict(orient='records'))

    except Exception as e:
        app.logger.error(f"Error in inventory_search: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/inventory/add', methods=['POST'])
def inventory_add():
    """
    Handles adding a new product or updating an existing one in the inventory.
    Supports both JSON data (for manual entries) and multipart/form-data (for entries with images).
    """
    # Initialize product_data from request.form (for multipart/form-data)
    # This will contain all text fields.
    product_data = {key: request.form.get(key) for key in request.form}

    # Handle 'product_image' which comes via request.files if a Blob was appended
    image_url = ''
    if 'product_image' in request.files:
        file = request.files['product_image']
        if file.filename != '': # Check if a file was actually sent
            filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}") # Generate unique name
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            try:
                file.save(filepath)
                image_url = f"/static/images/products/{filename}"
                print(f"Server: Image saved to {filepath}, URL: {image_url}")
            except Exception as e:
                print(f"Server: Error saving image file: {e}")
                app.logger.error(f"Error saving image file: {e}", exc_info=True)
                # Keep image_url as empty string on save error
    
    # Update image_url in product_data. This will overwrite if a direct 'image_url' was in form data,
    # but prioritize the uploaded image if present.
    product_data['image_url'] = image_url if image_url else product_data.get('image_url', '')

    # Generate a barcode if not provided by the user (for manual entries)
    if 'barcode' not in product_data or not product_data['barcode']:
        product_data['barcode'] = f"MANUAL_{int(time.time())}"

    # Load inventory using your utility function
    df = load_inventory(app.config['INVENTORY_FILE'])

    try:
        # Check if product exists by barcode (case-insensitive for robustness)
        existing_product_df = df[df['barcode'].astype(str).str.lower() == str(product_data['barcode']).lower()]

        if not existing_product_df.empty:
            # Update existing product
            idx = existing_product_df.index[0]
            # Iterate through product_data to update fields
            for key, value in product_data.items():
                if key in df.columns: # Only update if column exists in DataFrame
                    if key in ['quantity', 'threshold']:
                        df.at[idx, key] = int(value) if value else 0
                    elif key in ['cost', 'price']:
                        df.at[idx, key] = float(value) if value else 0.0
                    else:
                        df.at[idx, key] = str(value) if value is not None else ''
            print(f"Server: Product {product_data['barcode']} updated. New image_url: {product_data['image_url']}")

        else:
            # Add new product
            new_product_row = {
                'barcode': str(product_data.get('barcode')),
                'name': str(product_data.get('name', '')),
                'category': str(product_data.get('category', 'Uncategorized')),
                'quantity': int(product_data.get('quantity', 0)),
                'cost': float(product_data.get('cost', 0.0)),
                'price': float(product_data.get('price', 0.0)),
                'expiry': str(product_data.get('expiry', '')),
                'threshold': int(product_data.get('threshold', 0)),
                'distributor': str(product_data.get('distributor', '')),
                'manufacturer': str(product_data.get('manufacturer', '')),
                'synced': bool(product_data.get('synced', False)),
                'image_url': str(product_data.get('image_url', '')),
                'description': str(product_data.get('description', ''))
            }
            # Ensure all columns exist in the new row DataFrame, add missing ones with default empty values
            new_product_df = pd.DataFrame([new_product_row], columns=df.columns if not df.empty else list(new_product_row.keys()))
            df = pd.concat([df, new_product_df], ignore_index=True)
            print(f"Server: New product {product_data['barcode']} added. Image_url: {product_data['image_url']}")

        save_inventory(app.config['INVENTORY_FILE'], df) # Save using your utility function
        return jsonify({'status': 'ok', 'message': 'Product added/updated successfully.'})

    except Exception as e:
        app.logger.error(f"Error adding/updating product: {e}", exc_info=True) # Log full traceback
        return jsonify({'error': str(e)}), 500

    
@app.route('/inventory/categories', methods=['GET'])
def inventory_categories():
    """
    Returns a JSON list of unique categories present in the inventory.
    """
    try:
        df = load_inventory(app.config['INVENTORY_FILE'])
        categories = df['category'].dropna().unique().tolist()
        # Remove empty categories and sort
        categories = [cat for cat in categories if cat.strip()]
        categories.sort()
        return jsonify({'categories': categories})
    except Exception as e:
        app.logger.error(f"Error getting categories: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/inventory/alerts', methods=['GET'])
def inventory_alerts():
    """
    Returns a JSON object containing different types of inventory alerts (expiry, understock, overstock).
    """
    df = load_inventory(app.config['INVENTORY_FILE'])
    return jsonify(get_alerts(df))

@app.route('/inventory/order', methods=['POST'])
def inventory_order():
    """
    Handles placing an order.
    """
    data = request.json or {}
    order = create_order(data)
    df = load_orders(app.config['ORDERS_FILE'])
    df = pd.concat([df, pd.DataFrame([order])], ignore_index=True)
    save_orders(app.config['ORDERS_FILE'], df)
    return jsonify({'status':'ok','order': order})

@app.route('/inventory/sync', methods=['POST'])
def inventory_sync():
    """
    Marks a product as synced.
    """
    data = request.json or {}
    barcode = data.get('barcode')
    df = load_inventory(app.config['INVENTORY_FILE'])
    idx = df.index[df['barcode']==barcode]
    if len(idx)==0:
        return jsonify({'error':'not found'}),404
    i=idx[0]
    df.at[i,'synced']='True'
    save_inventory(app.config['INVENTORY_FILE'], df)
    return jsonify({'status':'synced','barcode':barcode})

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyzes an uploaded data file (CSV, XLSX, JSON, TSV).
    """
    if 'file' not in request.files:
        return jsonify({'error':'No file part'}),400
    f = request.files['file']
    if f.filename=='' or not allowed_file(f.filename):
        return jsonify({'error':'No selected file or unsupported'}),400
    
    name = secure_filename(f.filename.lower())
    content = f.read()
    
    # Excel
    if name.endswith(('.xls','xlsx')):
        df = pd.read_excel(io.BytesIO(content))
    # JSON
    elif name.endswith('.json'):
        df = pd.read_json(io.BytesIO(content))
    # TSV
    elif name.endswith('.tsv'):
        df = pd.read_csv(io.StringIO(content.decode('utf-8','ignore')), sep='\t')
    # CSV
    else:
        for enc in ['utf-8','latin1','ISO-8859-1','cp1252','utf-16']:
            try:
                df = pd.read_csv(io.StringIO(content.decode(enc)))
                break
            except:
                continue
        else:
            return jsonify({'error':'Failed to decode'}),400
    
    results = process_data(df)
    return jsonify(results)

@app.route('/sample', methods=['GET'])
def sample():
    """
    Returns sample data for analysis demonstration.
    """
    return jsonify({
        "kpis": {
            "total_sales": 15000,
            "avg_order_value": 125.50,
            "conversion_rate": 3.2,
            "top_product": "Widget X"
        },
        "charts": {
            "sales_trend": "base64_encoded_image_data",
            "category_distribution": "base64_encoded_image_data"
        },
        "insights": [
            "Sales increased by 15% month-over-month",
            "Category Y shows highest growth potential"
        ],
        "preview": [
            {"date": "2023-01-01", "product": "A", "quantity": 2, "price": 10},
            {"date": "2023-01-02", "product": "B", "quantity": 1, "price": 20}
        ]
    })

@app.route('/api/barcode/<barcode_val>')
def api_barcode_lookup(barcode_val):
    """
    Simulates an external API lookup for product information by barcode.
    Provides dummy data for specific barcodes or a 'not found' response.
    Includes fallback to local inventory if not found externally.
    """
    # First try public databases (using your utils.barcode.lookup_barcode)
    result = lookup_barcode(barcode_val)
    if result and result.get('name'):
        # If found, return the result
        return jsonify(result)
    
    # If not found in public databases, check local inventory
    df = load_inventory(app.config['INVENTORY_FILE'])
    # Ensure barcode column is string for consistent comparison
    product = df[df['barcode'].astype(str) == barcode_val] 
    if not product.empty:
        # If found in local inventory, return its details
        return jsonify(product.iloc[0].to_dict())
    
    # If not found anywhere
    return jsonify({"message": "Product not found"}), 404


@app.route('/inventory/adjust-stock', methods=['POST'])
def adjust_stock():
    """
    Adjusts the quantity of a product based on its barcode.
    Expects JSON input with 'barcode' and 'adjustment' (integer).
    Logs adjustment to stock_history.csv.
    """
    try:
        data = request.json
        barcode = str(data.get('barcode')) # Ensure barcode is string
        adjustment = int(data.get('adjustment', 0))
        
        df = load_inventory(app.config['INVENTORY_FILE']) # Use your util function

        # Check if the product exists using string comparison
        if barcode not in df['barcode'].astype(str).values:
            return jsonify({
                'status': 'error',
                'message': f'Product with barcode {barcode} not found. Add it first.'
            }), 404
        
        # Find and update the product's quantity:
        # Use .loc for safe label-based indexing
        idx = df.index[df['barcode'].astype(str) == barcode].tolist()[0]
        
        # Convert to int, handle potential NaN or non-numeric values
        current_qty_str = df.at[idx, 'quantity']
        current_qty = int(current_qty_str) if pd.notna(current_qty_str) and str(current_qty_str).isdigit() else 0
        
        new_qty = max(0, current_qty + adjustment)
        df.at[idx, 'quantity'] = str(new_qty) # Store back as string for CSV compatibility
        
        save_inventory(app.config['INVENTORY_FILE'], df)
        
        # Ensure the "data" folder exists before writing stock history
        os.makedirs("data", exist_ok=True)
        with open("data/stock_history.csv", mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([barcode, datetime.now().isoformat(), new_qty])
        
        return jsonify({
            'status': 'success',
            'new_quantity': new_qty,
            'message': f'Stock updated to {new_qty}'
        })
        
    except Exception as e:
        app.logger.error(f"Error adjusting stock: {e}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/')
def index():
    """Renders the main index.html template."""
    return render_template('index.html')


def notebook_demo():
    """
    Demonstration function for notebook environment.
    """
    print("---- INVENTORY DEMO ----")
    inv = load_inventory(app.config['INVENTORY_FILE'])
    print(inv.head(),"\n")
    print("---- ADD Demo ----")
    print(requests.post("http://localhost:5000/inventory/add",
                        json={'barcode':'000111222333','name':'Test','quantity':5}).json())
    print("---- COUNT ----", requests.get("http://localhost:5000/inventory/count").json())
    print("---- ALERTS ----", requests.get("http://localhost:5000/inventory/alerts").json())
    print("---- LOOKUP ----", lookup_barcode('056800513943'))
    df = pd.DataFrame([{'date':'2024-01-01','product':'A','quantity':2,'price':10}])
    print("---- KPI ----", process_data(df)['kpis'])


@app.route('/inventory/stock-history', methods=['GET'])
def stock_history():
    """
    Retrieves stock history for a given barcode from stock_history.csv.
    """
    barcode = request.args.get('barcode')
    if not barcode:
        return jsonify({'error': 'Barcode parameter is required.'}), 400

    history = []
    # Check if the history file exists
    if os.path.exists("data/stock_history.csv"):
        with open("data/stock_history.csv", mode="r", newline="") as file:
            reader = csv.reader(file)
            for row in reader:
                # Expect each row to have at least 3 fields: barcode, date, quantity
                if len(row) >= 3 and row[0] == barcode:
                    try:
                        history.append({
                            'date': row[1],
                            'quantity': int(row[2])
                        })
                    except Exception as e:
                        # If a conversion error occurs, skip this row.
                        app.logger.error(f"Error reading stock history row: {row}. Error: {e}")
                        continue
    # Optionally sort the history by date
    history.sort(key=lambda x: x['date'])

    return jsonify(history)


@app.route('/inventory/log-scan', methods=['POST'])
def log_scan():
    """
    Logs barcode scans to stock_history.csv.
    """
    try:
        data = request.json
        barcode = data.get('barcode')
        current_qty = data.get('current_qty')  # expected current stock level

        if not barcode or current_qty is None:
            return jsonify({'status': 'error', 'message': 'Both barcode and current_qty are required.'}), 400

        # Append the log entry to our CSV file:
        # Ensure the "data" folder exists first.
        os.makedirs("data", exist_ok=True)
        with open("data/stock_history.csv", mode="a", newline="") as file:
            writer = csv.writer(file)
            # Log the barcode, current timestamp, and current quantity.
            writer.writerow([barcode, datetime.now().isoformat(), current_qty])
        
        return jsonify({'status': 'success', 'message': 'Scan logged successfully'})
    except Exception as e:
        app.logger.error(f"Error logging scan: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500
    

if __name__ == '__main__':
    # Ensure data folder exists at startup
    os.makedirs('data', exist_ok=True)
    # Initialize inventory.csv with headers if it doesn't exist or is empty
    # This calls load_inventory and save_inventory from your utils module
    df_initial = load_inventory(app.config['INVENTORY_FILE'])
    if df_initial.empty:
        save_inventory(app.config['INVENTORY_FILE'], df_initial) # Ensure an empty CSV with headers is created
    
    if os.environ.get("COLAB_NOTEBOOK", ""):
        notebook_demo()
    else:
        app.run(host='0.0.0.0', debug=True)

