import pandas as pd
import os
from datetime import datetime

def load_inventory(file_path):
    if os.path.exists(file_path):
        # Read with dtype=str to prevent pandas from inferring types,
        # then explicitly convert where needed.
        df = pd.read_csv(file_path, dtype=str).fillna('')
        
        # Convert numeric columns after loading as string
        for col in ['quantity', 'threshold']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
        for col in ['cost', 'price']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0).astype(float)
        for col in ['synced']:
            if col in df.columns:
                df[col] = df[col].astype(bool) # Convert 'True'/'False' strings to actual booleans
        return df
    return pd.DataFrame(columns=[
        'barcode','name','category','quantity','cost','price','expiry',
        'threshold','distributor','manufacturer','synced','image_url','description'
    ]).astype({
        'barcode': 'str',
        'name': 'str',
        'category': 'str',
        'quantity': 'int',
        'cost': 'float',
        'price': 'float',
        'expiry': 'str',
        'threshold': 'int',
        'distributor': 'str',
        'manufacturer': 'str',
        'synced': 'bool',
        'image_url': 'str',
        'description': 'str'
    })



def save_inventory(file_path, df):
    df.to_csv(file_path, index=False)

def get_alerts(df):
    now = datetime.utcnow().date()
    alerts = {'expiry': [], 'understock': [], 'overstock': []}
    for _, row in df.iterrows():
        try:
            exp = datetime.strptime(row['expiry'], '%Y-%m-%d').date()
            days = (exp - now).days
            if days in (7, 3, 1):
                alerts['expiry'].append({'barcode': row['barcode'], 'days_to_expiry': days})
        except Exception as e:
            pass
        qty = int(float(row.get('quantity', 0)))
        thr = int(float(row.get('threshold', 0)))
        if thr > 0 and qty <= thr:
            alerts['understock'].append({'barcode': row['barcode'], 'quantity': qty, 'threshold': thr})
        if thr > 0 and qty > thr * 10:
            alerts['overstock'].append({'barcode': row['barcode'], 'quantity': qty, 'threshold': thr})
    return alerts
