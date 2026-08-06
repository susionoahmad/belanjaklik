from excel_exporter import export_to_excel


PRODUCTS = [
    {
        "product_name": "GLOW & LOVELY SPF35+ Vit C 40g",
        "brand": "Glow & Lovely", "variant": "SPF35+ Vit C", "package_size": "40g",
        "price": 29900, "original_price": 38500,
    },
    {
        "product_name": "GLOW & LOVELY FF Multi Vit, Vit C Glow 100g",
        "brand": "Glow & Lovely", "variant": "FF Multi Vit, Vit C Glow", "package_size": "100g",
        "price": 24900, "original_price": 38500,
    },
    {
        "product_name": "GLOW & LOVELY Cream Multi Vit 50g",
        "brand": "Glow & Lovely", "variant": "Cream Multi Vit", "package_size": "50g",
        "price": 34900, "original_price": 48900,
    },
    {
        "product_name": "HANASUI Sunscreen, Calm SPF50++ 30ml",
        "brand": "Hanasui", "variant": "Sunscreen, Calm SPF50++", "package_size": "30ml",
        "price": 32900, "original_price": 38800,
    },
    {
        "product_name": "HANASUI Sunscreen SP30 30ml",
        "brand": "Hanasui", "variant": "Sunscreen SP30", "package_size": "30ml",
        "price": 24500, "original_price": 30500,
    },
    {
        "product_name": "HERS PROTEX Comf Night W30CM 20p",
        "brand": "Hers Protex", "variant": "Comf Night W30CM", "package_size": "20p",
        "price": 14500, "original_price": 16900,
    },
    {
        "product_name": "HERS PROTEX Cinmrol Night 20+4p",
        "brand": "Hers Protex", "variant": "Cinmrol Night", "package_size": "20+4p",
        "price": 16900, "original_price": 20600,
    },
    {
        "product_name": "SOFTEX Daun Sirih Reg Wing 23CM 20p",
        "brand": "Softex", "variant": "Daun Sirih Reg Wing", "package_size": "23CM 20p",
        "price": 17500, "original_price": 17800,
    },
    {
        "product_name": "SOFTEX Daun Sirih 3in1 Wing 16p",
        "brand": "Softex", "variant": "Daun Sirih 3in1 Wing", "package_size": "16p",
        "price": 23900, "original_price": 24900,
    },
    {
        "product_name": "LAURIER Relax Night W35CM 12p",
        "brand": "Laurier", "variant": "Relax Night W35CM", "package_size": "12p",
        "price": 15900, "original_price": 19800,
    },
    {
        "product_name": "LAURIER Relax Night 30CM 24p",
        "brand": "Laurier", "variant": "Relax Night", "package_size": "30CM 24p",
        "price": 21900, "original_price": 26700,
    },
    {
        "product_name": "CHARM Safe Night Wing 35CM 12p",
        "brand": "Charm", "variant": "Safe Night Wing", "package_size": "35CM 12p",
        "price": 17900, "original_price": 22800,
    },
]

for product in PRODUCTS:
    product.update({
        "stock_status": "Tersedia",
        "category": "Promo Merchant",
        "promo_type": "GANTUNG",
        "promo_badge": "PROMO GANTUNG",
        "promo_title": "Promo Gantung Alfamart",
        "promo_start_date": "2026-07-28",
        "promo_end_date": "2026-08-03",
        "image": "",
    })

export_to_excel(PRODUCTS, "D:/PROJECT/alfamind/ocr/hasil_gantung8.xlsx")
