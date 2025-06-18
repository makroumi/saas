import pandas as pd
from datetime import datetime
import os

def load_orders(file_path):
    if os.path.exists(file_path):
        return pd.read_csv(file_path, dtype=str)
    return pd.DataFrame(columns=[
        'order_id','barcode','quantity','timestamp','status'
    ])

def save_orders(file_path, df):
    df.to_csv(file_path, index=False)

def create_order(data):
    order_id = str(int(datetime.utcnow().timestamp()))
    return {
        'order_id': order_id,
        'barcode': data.get('barcode',''),
        'quantity': str(data.get('quantity',0)),
        'timestamp': datetime.utcnow().isoformat(),
        'status': 'placed'
    }