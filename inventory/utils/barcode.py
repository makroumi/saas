import requests

def lookup_barcode(barcode):
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            d = r.json()
            if d.get("status") == 1:
                p = d["product"]
                if p.get("product_name") and p.get("product_name").strip():
                    return {
                        "barcode": barcode,
                        "name": p.get("product_name"),
                        "brand": p.get("brands"),
                        "category": p.get("categories"),
                        "image_url": p.get("image_front_small_url")
                    }
    except Exception:
        pass
    
    try:
        url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            d = r.json()
            items = d.get("items", [])
            if items:
                p = items[0]
                if p.get("title") and p.get("title").strip():
                    return {
                        "barcode": barcode,
                        "name": p.get("title"),
                        "brand": p.get("brand"),
                        "category": p.get("category"),
                        "image_url": p.get("images", [None])[0]
                    }
    except Exception:
        pass
    
    return {}