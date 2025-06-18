import pandas as pd
import os
from datetime import datetime

def load_inventory(file_path):
    if os.path.exists(file_path):
        return pd.read_csv(file_path, dtype=str)
    return pd.DataFrame(columns=[
        'barcode','name','category','quantity','cost','price','expiry',
        'threshold','distributor','manufacturer','synced'
    ])

def save_inventory(file_path, df):
    df.to_csv(file_path, index=False)

def get_alerts(df):
    now = datetime.utcnow().date()
    alerts = {'expiry':[], 'understock':[], 'overstock':[]}
    for _, row in df.iterrows():
        try:
            exp = datetime.strptime(row['expiry'],'%Y-%m-%d').date()
            days = (exp - now).days
            if days in (7,3,1):
                alerts['expiry'].append({'barcode':row['barcode'],'days_to_expiry':days})
        except:
            pass
        qty = int(float(row.get('quantity',0)))
        thr = int(float(row.get('threshold',0)))
        if thr>0 and qty<=thr:
            alerts['understock'].append({'barcode':row['barcode'],'quantity':qty,'threshold':thr})
        if qty> thr*10:
            alerts['overstock'].append({'barcode':row['barcode'],'quantity':qty,'threshold':thr})
    return alerts