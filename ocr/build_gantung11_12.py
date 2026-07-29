from excel_exporter import export_to_excel

rows = []
def add(image, source, names, brand, variant, size, price, original):
    for name in names:
        rows.append({
            'product_name': name, 'brand': brand, 'variant': variant, 'package_size': size,
            'price': price, 'original_price': original,
            'discount_percentage': round((original - price) / original * 100),
            'stock_status': 'Tersedia', 'category': 'Promo Merchant', 'promo_type': 'GANTUNG',
            'promo_badge': 'PROMO GANTUNG', 'promo_title': 'Promo Gantung Alfamart',
            'promo_start_date': '2026-07-28', 'promo_end_date': '2026-08-03', 'image': '',
            '_image': image, '_source': source
        })

add('Gantung11.jpeg', 1, ['CHARM Safe Night Wing 35CM 18p'], 'Charm', 'Safe Night Wing', '35CM 18p', 24900, 30000)
add('Gantung11.jpeg', 2, ['CONFIDENCE Pants Tipis&Pas M-10', 'CONFIDENCE Pants Tipis&Pas L-8'], 'Confidence', 'Pants Tipis&Pas', 'M-10 / L-8', 46900, 50500)
add('Gantung11.jpeg', 3, ['CONFIDENCE Pants Eks Serap M-10', 'CONFIDENCE Pants Eks Serap L-8', 'CONFIDENCE Pants Eks Serap XL-6'], 'Confidence', 'Pants Eks Serap', 'M-10 / L-8 / XL-6', 59900, 60500)
add('Gantung11.jpeg', 4, ['ALFAMART Adult Diapers M-8,L-7'], 'Alfamart', 'Adult Diapers', 'M-8,L-7', 38900, 43900)
add('Gantung11.jpeg', 5, ['ALFAMART Adult Diapers Pnts M-8'], 'Alfamart', 'Adult Diapers Pnts', 'M-8', 38900, 52900)
add('Gantung11.jpeg', 6, ['ALFAMART Adult Diapers Pnts L-8'], 'Alfamart', 'Adult Diapers Pnts', 'L-8', 42900, 54900)
add('Gantung11.jpeg', 7, ['ALFAMART Fac Tissue B2G1'], 'Alfamart', 'Fac Tissue B2G1', '', 19900, 23900)
add('Gantung11.jpeg', 8, ['ALFAMART Fac Tissue 700g/700s'], 'Alfamart', 'Fac Tissue', '700g/700s', 27900, 41500)
add('Gantung11.jpeg', 9, ['ALFAMART Sanrio Fac Tissue B2G1'], 'Alfamart', 'Sanrio Fac Tissue B2G1', '', 7900, 9900)
add('Gantung11.jpeg', 10, ['ALFAMART Kitten Tuna 900+100g', 'ALFAMART Cat Food Tuna 1kg'], 'Alfamart', 'Cat Food Tuna', '900+100g / 1kg', 38900, 49900)

add('Gantung12.jpeg', 1, ['OREO SW Choco Cream 105g', 'OREO Ice Cream Bry 105g', 'OREO Strawberry 105g', 'OREO Vanilla 105g'], 'Oreo', 'SW', '105g', 9400, 9900)
add('Gantung12.jpeg', 2, ['OREO SW Dark White Cho 105g'], 'Oreo', 'SW Dark White Cho', '105g', 10200, 10600)
add('Gantung12.jpeg', 3, ['OREO SW Red Velvet 105g'], 'Oreo', 'SW Red Velvet', '105g', 10900, 11300)
add('Gantung12.jpeg', 4, ['RITZ Cracker Ori 100g'], 'Ritz', 'Cracker Ori', '100g', 7500, 8500)
add('Gantung12.jpeg', 5, ['RITZ Cracker Cheese 91g', 'RITZ Choco 91g', 'RITZ Kaya Butter 91g'], 'Ritz', 'Cracker', '91g', 8500, 9600)
add('Gantung12.jpeg', 6, ['SILVER QUEEN Chunky Csw 82g', 'SILVER QUEEN Almond 82g'], 'Silver Queen', 'Chunky', '82g', 20500, 26500)
add('Gantung12.jpeg', 7, ['TANGO Wafer Sassy Str 100g', 'TANGO Chocolate 100g', 'TANGO Vanilla 100g'], 'Tango', 'Wafer Sassy Str', '100g', 5900, 8900)
add('Gantung12.jpeg', 8, ['BISKUAT Chocolate Original 106,4g'], 'Biskuat', 'Chocolate Original', '106,4g', 7500, 9300)
add('Gantung12.jpeg', 9, ['BISKUAT Bites Ori 35g', 'BISKUAT Bites Cokelat 35g'], 'Biskuat', 'Bites', '35g', 10000, 10000)
add('Gantung12.jpeg', 10, ['HELLO PANDA 42g All Var'], 'Hello Panda', 'All Var', '42g', 7300, 8900)
add('Gantung12.jpeg', 11, ['DUA KELINCI Kacang Kulit 180g'], 'Dua Kelinci', 'Kacang Kulit', '180g', 18500, 21500)
add('Gantung12.jpeg', 12, ['DUA KELINCI Kacang Sangrai 180g'], 'Dua Kelinci', 'Kacang Sangrai', '180g', 18500, 22000)

for item in rows:
    item.pop('_image', None)
    item.pop('_source', None)
export_to_excel(rows, 'D:/PROJECT/alfamind/ocr/hasil_gantung11&12.xlsx')
