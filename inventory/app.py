import os
import re
import io
import warnings
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
from utils.inventory import load_inventory, save_inventory, get_alerts
from utils.orders import load_orders, save_orders, create_order
from utils.barcode import lookup_barcode
from utils.analysis import process_data
import requests
from datetime import datetime

warnings.filterwarnings('ignore')

app = Flask(__name__)
app.config['INVENTORY_FILE'] = "data/inventory.csv"
app.config['ORDERS_FILE'] = "data/orders.csv"
app.config['ALLOWED_EXTS'] = {'csv','xlsx','xls','json','tsv','pdf','png','jpg','jpeg','gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in app.config['ALLOWED_EXTS']

def fuzzy_column_match(col, aliases):
    def normalize(s):
        return re.sub(r'[^a-z0-9]', '', s.lower())
    cn = normalize(col)
    return any(cn == normalize(a) for a in aliases)

@app.route('/inventory/count', methods=['GET'])
def inventory_count():
    df = load_inventory(app.config['INVENTORY_FILE'])
    return jsonify(df.to_dict(orient='records'))

# Update the search function to handle barcodes properly
@app.route('/inventory/search', methods=['GET'])
def inventory_search():
    q = request.args.get('q', '').strip().lower()
    df = load_inventory(app.config['INVENTORY_FILE'])

    if not q:
        return jsonify([])

    try:
        if q.isdigit():
            results = df[df['barcode'].astype(str) == q]
            if not results.empty:
                return jsonify(results.fillna('').to_dict(orient='records'))

        results = df[df['name'].str.lower().str.contains(q, na=False)]
        return jsonify(results.fillna('').to_dict(orient='records'))

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Update the add function to save products properly
@app.route('/inventory/add', methods=['POST'])
def inventory_add():
    try:
        data = request.json or {}
        df = load_inventory(app.config['INVENTORY_FILE'])

        if 'barcode' not in data or not data['barcode']:
            return jsonify({'error': 'Barcode is required'}), 400

        barcode = str(data['barcode'])

        if barcode in df['barcode'].astype(str).values:
            # Update existing product
            idx = df.index[df['barcode'].astype(str) == barcode].tolist()[0]
            for key, value in data.items():
                if key in df.columns and key != 'barcode':
                    df.at[idx, key] = value
        else:
            # Add new product
            new_product = {
                'barcode': barcode,
                'name': data.get('name', ''),
                'category': data.get('category', ''),
                'quantity': data.get('quantity', 0),
                'cost': data.get('cost', 0),
                'price': data.get('price', 0),
                'expiry': data.get('expiry', ''),
                'threshold': data.get('threshold', 0),
                'distributor': data.get('distributor', ''),
                'manufacturer': data.get('manufacturer', ''),
                'synced': data.get('synced', False),
                'image_url': data.get('image_url', '')
            }
            df = pd.concat([df, pd.DataFrame([new_product])], ignore_index=True)

        save_inventory(app.config['INVENTORY_FILE'], df)
        df = df.fillna('')  # ← THIS FIXES YOUR FRONTEND CRASH

        return jsonify({'status': 'ok', 'inventory': df.to_dict(orient='records')})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/inventory/alerts', methods=['GET'])
def inventory_alerts():
    df = load_inventory(app.config['INVENTORY_FILE'])
    return jsonify(get_alerts(df))

@app.route('/inventory/order', methods=['POST'])
def inventory_order():
    data = request.json or {}
    order = create_order(data)
    df = load_orders(app.config['ORDERS_FILE'])
    df = pd.concat([df, pd.DataFrame([order])], ignore_index=True)
    save_orders(app.config['ORDERS_FILE'], df)
    return jsonify({'status':'ok','order': order})

@app.route('/inventory/sync', methods=['POST'])
def inventory_sync():
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

# Update the API endpoint
@app.route('/api/barcode/<barcode>', methods=['GET'])
def api_barcode_lookup(barcode):
    # First try public databases
    result = lookup_barcode(barcode)
    if result and result.get('name'):
        return jsonify(result)
    
    # # If not found in public databases, check local inventory
    # df = load_inventory(app.config['INVENTORY_FILE'])
    # product = df[df['barcode'] == barcode]
    # if not product.empty:
    #     return jsonify(product.iloc[0].to_dict())
    
    # return jsonify({}), 404


@app.route('/inventory/adjust-stock', methods=['POST'])
def adjust_stock():
    try:
        data = request.json
        barcode = data.get('barcode')
        adjustment = int(data.get('adjustment', 0))
        
        # Load inventory
        def load_inventory(filepath):
            if os.path.exists(filepath):
                return pd.read_csv(filepath, dtype=str).fillna('')
            return pd.DataFrame(columns=[
        'barcode','name','category','quantity','cost','price','expiry',
        'threshold','distributor','manufacturer','synced','image_url'
    ])
        df = load_inventory(app.config['INVENTORY_FILE'])

        
        # Check if product exists
        if barcode not in df['barcode'].values:
            return jsonify({
                'status': 'error',
                'message': f'Product with barcode {barcode} not found. Add it first.'
            }), 404
        
        # Find and update the product
        index = df.index[df['barcode'] == barcode].tolist()[0]
        current_qty = int(df.at[index, 'quantity'])
        new_qty = max(0, current_qty + adjustment)
        df.at[index, 'quantity'] = str(new_qty)
        
        # Save changes
        save_inventory(app.config['INVENTORY_FILE'], df)
        
        return jsonify({
            'status': 'success',
            'new_quantity': new_qty,
            'message': f'Stock updated to {new_qty}'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/')
def index():
    return render_template('index.html')


def notebook_demo():
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

if __name__ == '__main__':
    import os
    os.makedirs('data', exist_ok=True)
    if os.environ.get("COLAB_NOTEBOOK", ""):
        notebook_demo()
    else:
        app.run(host='0.0.0.0', debug=True)