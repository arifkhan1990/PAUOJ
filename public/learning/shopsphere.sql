PRAGMA foreign_keys = ON;
CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES categories(id));
CREATE TABLE vendors (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, rating REAL NOT NULL);
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, signup_date TEXT NOT NULL);
CREATE TABLE products (id INTEGER PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES vendors(id), category_id INTEGER NOT NULL REFERENCES categories(id), name TEXT NOT NULL, price_cents INTEGER NOT NULL, stock INTEGER NOT NULL, rating REAL NOT NULL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), ordered_at TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL);
CREATE TABLE reviews (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id), customer_id INTEGER NOT NULL REFERENCES customers(id), rating INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE referrals (customer_id INTEGER PRIMARY KEY REFERENCES customers(id), referred_by INTEGER REFERENCES customers(id));

INSERT INTO categories VALUES
 (1,'Electronics',NULL),(2,'Audio',1),(3,'Headphones',2),
 (4,'Books',NULL),(5,'Fiction',4),
 (6,'Fashion',NULL),(7,'Men',6),
 (8,'Home',NULL);

INSERT INTO vendors VALUES
 (1,'TechNest','Dhaka',4.8),(2,'BookBazar','Chattogram',4.3),
 (3,'StyleHub','Dhaka',4.6),(4,'GadgetPoint','Sylhet',4.1),
 (5,'HomeCraft','Khulna',4.9),
 (6,'PaperTrail','Rajshahi',4.0);

INSERT INTO customers VALUES
 (1,'Rahim','Dhaka','2026-01-12'),(2,'Karim','Chattogram','2026-02-03'),
 (3,'Nusrat','Dhaka','2026-02-21'),(4,'Sajid','Sylhet','2026-03-05'),
 (5,'Mim','Khulna','2026-03-18'),(6,'Tanvir','Dhaka','2026-04-02');

INSERT INTO products VALUES
 (1,1,1,'Mechanical Keyboard',450000,12,4.7),
 (2,1,1,'USB-C Hub',220000,8,4.2),
 (3,1,1,'27in Monitor',1850000,5,4.6),
 (4,2,4,'Clean Code',180000,30,4.9),
 (5,2,4,'SQL Handbook',95000,9,4.5),
 (6,3,7,'Cotton Panjabi',240000,14,4.4),
 (7,3,6,'Leather Wallet',120000,25,4.1),
 (8,4,1,'Wireless Mouse',85000,3,4.0),
 (9,4,1,'Laptop Stand',150000,11,4.3),
 (10,5,8,'Clay Dinner Set',320000,6,4.8),
 (11,5,8,'Table Lamp',110000,18,4.2),
 (12,1,1,'Webcam',350000,2,4.0),
 (13,2,5,'Dune',210000,12,4.9),
 (14,3,7,'Denim Jacket',380000,7,4.5);

INSERT INTO orders VALUES
 (1,1,'2026-10-01','paid'),(2,2,'2026-10-03','pending'),
 (3,3,'2026-10-05','paid'),(4,1,'2026-10-10','paid'),
 (5,4,'2026-10-12','cancelled'),(6,1,'2026-10-20','paid'),
 (7,5,'2026-10-22','paid'),(8,2,'2026-10-25','shipped'),
 (9,3,'2026-10-28','paid'),(10,6,'2026-11-02','paid');

INSERT INTO order_items VALUES
 (1,1,1,1,450000),(2,1,2,2,220000),(3,2,4,1,180000),
 (4,3,6,2,240000),(5,3,7,1,120000),(6,4,3,1,1850000),
 (7,4,9,1,150000),(8,5,8,2,85000),(9,6,5,3,95000),
 (10,6,10,1,320000),(11,7,1,1,450000),(12,7,11,2,110000),
 (13,8,4,1,180000),(14,9,7,1,120000),(15,10,14,1,380000);

INSERT INTO reviews VALUES
 (1,1,1,5,'2026-10-02'),(2,4,2,4,'2026-10-04'),
 (3,4,3,5,'2026-10-06'),(4,6,1,4,'2026-10-07'),
 (5,10,5,5,'2026-10-23'),(6,7,3,3,'2026-10-29');

INSERT INTO referrals VALUES
 (2,1),(3,1),(4,2),(5,2),(6,NULL);

-- Order lifecycle, marketing, inventory and finance tables.
CREATE TABLE product_attributes (product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE, brand TEXT NOT NULL, color TEXT, warranty_months INTEGER, attributes TEXT NOT NULL);
CREATE TABLE product_variants (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, sku TEXT NOT NULL UNIQUE, size TEXT, color TEXT, price_cents INTEGER NOT NULL, stock INTEGER NOT NULL);
CREATE TABLE payments (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, method TEXT NOT NULL, amount_cents INTEGER NOT NULL, status TEXT NOT NULL, paid_at TEXT, transaction_ref TEXT);
CREATE TABLE shipments (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, carrier TEXT NOT NULL, tracking_no TEXT NOT NULL, status TEXT NOT NULL, shipped_at TEXT, delivered_at TEXT);
CREATE TABLE returns (id INTEGER PRIMARY KEY, order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE, quantity INTEGER NOT NULL, reason TEXT NOT NULL, refund_cents INTEGER NOT NULL, status TEXT NOT NULL, requested_at TEXT);
CREATE TABLE coupons (id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, value INTEGER NOT NULL, min_order_cents INTEGER NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, max_uses INTEGER);
CREATE TABLE coupon_redemptions (id INTEGER PRIMARY KEY, coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE, discount_cents INTEGER NOT NULL, redeemed_at TEXT NOT NULL);
CREATE TABLE carts (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE cart_items (id INTEGER PRIMARY KEY, cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL, added_at TEXT NOT NULL);
CREATE TABLE inventory_movements (id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, kind TEXT NOT NULL, quantity INTEGER NOT NULL, reference TEXT, created_at TEXT NOT NULL);
CREATE TABLE vendor_payouts (id INTEGER PRIMARY KEY, vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE, period_start TEXT NOT NULL, period_end TEXT NOT NULL, gross_cents INTEGER NOT NULL, commission_cents INTEGER NOT NULL, refund_cents INTEGER NOT NULL, net_cents INTEGER NOT NULL, status TEXT NOT NULL, paid_at TEXT);

INSERT INTO product_attributes VALUES
 (1,'Logitech','black',24,'{"brand":"Logitech","color":"black","connectivity":"wireless","warranty_months":24}'),
 (2,'Anker','gray',18,'{"brand":"Anker","color":"gray","ports":7,"warranty_months":18}'),
 (3,'Samsung','black',36,'{"brand":"Samsung","color":"black","panel":"IPS","warranty_months":36}'),
 (4,'Prentice Hall','white',0,'{"brand":"Prentice Hall","color":"white","format":"hardcover","warranty_months":0}'),
 (5,'OReilly','blue',0,'{"brand":"OReilly","color":"blue","format":"paperback","warranty_months":0}'),
 (6,'Aarong','maroon',0,'{"brand":"Aarong","color":"maroon","fabric":"cotton","warranty_months":0}'),
 (7,'Fossil','brown',12,'{"brand":"Fossil","color":"brown","material":"leather","warranty_months":12}'),
 (8,'Logitech','black',12,'{"brand":"Logitech","color":"black","connectivity":"wireless","warranty_months":12}'),
 (9,'Ugreen','silver',24,'{"brand":"Ugreen","color":"silver","material":"aluminum","warranty_months":24}'),
 (10,'ClayCraft','white',0,'{"brand":"ClayCraft","color":"white","pieces":6,"warranty_months":0}'),
 (11,'Philips','white',24,'{"brand":"Philips","color":"white","wattage":9,"warranty_months":24}'),
 (12,'Logitech','black',12,'{"brand":"Logitech","color":"black","resolution":"1080p","warranty_months":12}'),
 (13,'Ace Books','orange',0,'{"brand":"Ace Books","color":"orange","format":"paperback","warranty_months":0}'),
 (14,'Levis','blue',0,'{"brand":"Levis","color":"blue","fabric":"denim","warranty_months":0}');

INSERT INTO product_variants VALUES
 (1,1,'KB-MECH-BLK','standard','black',450000,7),(2,1,'KB-MECH-WHT','standard','white',460000,5),
 (3,3,'MON-27-BLK','27in','black',1850000,3),(4,3,'MON-32-BLK','32in','black',2350000,2),
 (5,6,'PANJABI-M','M','maroon',240000,6),(6,6,'PANJABI-L','L','maroon',240000,4),
 (7,6,'PANJABI-XL','XL','maroon',250000,4),(8,10,'DINNER-4','4-piece','white',320000,4),
 (9,10,'DINNER-6','6-piece','white',420000,2),(10,14,'JACKET-M','M','blue',380000,3),
 (11,14,'JACKET-L','L','blue',390000,4),(12,4,'BOOK-CC-HB','hardcover','white',220000,15);

INSERT INTO payments VALUES
 (1,1,'bkash',890000,'paid','2026-10-01 10:15','BK8901'),
 (2,2,'cod',180000,'pending',NULL,NULL),
 (3,3,'card',600000,'paid','2026-10-05 12:40','CRD6001'),
 (4,4,'bkash',2000000,'paid','2026-10-10 09:05','BK2001'),
 (5,5,'card',170000,'failed','2026-10-12 15:20','CRD1701'),
 (6,6,'cod',605000,'paid','2026-10-20 18:10','COD6051'),
 (7,7,'bkash',670000,'paid','2026-10-22 14:30','BK6701'),
 (8,8,'card',180000,'paid','2026-10-25 11:00','CRD1801'),
 (9,9,'bkash',120000,'paid','2026-10-28 16:45','BK1201'),
 (10,10,'card',380000,'paid','2026-11-02 13:20','CRD3801'),
 (11,1,'bkash',450000,'refunded','2026-10-08 09:00','BKR4501');

INSERT INTO shipments VALUES
 (1,1,'Sundarban','SUN-1001','delivered','2026-10-02','2026-10-04'),
 (2,3,'Pathao','PAT-1003','delivered','2026-10-06','2026-10-07'),
 (3,4,'Sundarban','SUN-1004','shipped','2026-10-11',NULL),
 (4,6,'Pathao','PAT-1006','delivered','2026-10-21','2026-10-23'),
 (5,7,'Sundarban','SUN-1007','shipped','2026-10-23',NULL),
 (6,8,'Pathao','PAT-1008','delivered','2026-10-26','2026-10-28'),
 (7,9,'Sundarban','SUN-1009','delivered','2026-10-29','2026-10-31'),
 (8,10,'Pathao','PAT-1010','pending',NULL,NULL);

INSERT INTO returns VALUES
 (1,1,1,'damaged',450000,'approved','2026-10-08'),
 (2,10,1,'wrong item',320000,'approved','2026-11-10'),
 (3,12,1,'changed mind',110000,'rejected','2026-10-26'),
 (4,7,1,'late delivery',150000,'pending','2026-10-30');

INSERT INTO coupons VALUES
 (1,'WELCOME10','percent',10,100000,'2026-10-01','2026-12-31',100),
 (2,'FESTIVE500','fixed',50000,300000,'2026-10-01','2026-11-15',50),
 (3,'FREESHIP','fixed',6000,50000,'2026-10-01','2026-12-31',200),
 (4,'TECH15','percent',15,500000,'2026-10-01','2026-10-31',20);

INSERT INTO coupon_redemptions VALUES
 (1,1,1,1,89000,'2026-10-01'),
 (2,2,3,3,50000,'2026-10-05'),
 (3,4,4,1,300000,'2026-10-10'),
 (4,3,6,1,6000,'2026-10-20'),
 (5,2,7,5,50000,'2026-10-22'),
 (6,3,10,6,6000,'2026-11-02');

INSERT INTO carts VALUES
 (1,1,'converted','2026-09-30 10:00','2026-10-01 09:00'),
 (2,2,'abandoned','2026-10-02 12:00','2026-10-02 12:30'),
 (3,3,'converted','2026-10-04 09:00','2026-10-05 08:00'),
 (4,4,'abandoned','2026-10-08 15:00','2026-10-09 10:00'),
 (5,5,'converted','2026-10-20 11:00','2026-10-22 10:00'),
 (6,6,'active','2026-11-01 09:30','2026-11-01 10:00'),
 (7,1,'active','2026-11-10 18:00','2026-11-10 18:30'),
 (8,2,'converted','2026-10-24 09:00','2026-10-25 08:00');

INSERT INTO cart_items VALUES
 (1,1,1,1,450000,'2026-09-30 10:05'),(2,1,2,2,220000,'2026-09-30 10:10'),
 (3,2,4,1,180000,'2026-10-02 12:05'),(4,2,5,2,95000,'2026-10-02 12:10'),
 (5,3,6,2,240000,'2026-10-04 09:10'),(6,3,7,1,120000,'2026-10-04 09:15'),
 (7,4,8,2,85000,'2026-10-08 15:05'),(8,5,10,1,320000,'2026-10-20 11:05'),
 (9,5,11,2,110000,'2026-10-20 11:10'),(10,6,12,1,350000,'2026-11-01 09:35'),
 (11,6,9,1,150000,'2026-11-01 09:40'),(12,7,4,1,180000,'2026-11-10 18:05'),
 (13,8,4,1,180000,'2026-10-24 09:05'),(14,4,13,1,210000,'2026-10-08 15:10'),
 (15,2,14,1,380000,'2026-10-02 12:20');

INSERT INTO inventory_movements VALUES
 (1,1,'purchase',20,'PO-1001','2026-09-25'),(2,1,'sale',-1,'ORD-1','2026-10-01'),
 (3,1,'sale',-1,'ORD-7','2026-10-22'),(4,1,'return',1,'RET-1','2026-10-08'),
 (5,1,'adjustment',-7,'CYCLE-1','2026-10-31'),
 (6,2,'purchase',10,'PO-1002','2026-09-25'),(7,2,'sale',-2,'ORD-1','2026-10-01'),
 (8,3,'purchase',6,'PO-1003','2026-09-27'),(9,3,'sale',-1,'ORD-4','2026-10-10'),
 (10,4,'purchase',35,'PO-1004','2026-09-20'),(11,4,'sale',-1,'ORD-8','2026-10-25'),
 (12,4,'return',1,'RET-4','2026-10-30'),(13,4,'adjustment',-5,'CYCLE-2','2026-10-31'),
 (14,5,'purchase',9,'PO-1005','2026-09-22'),
 (15,6,'purchase',15,'PO-1006','2026-09-28'),(16,6,'sale',-2,'ORD-3','2026-10-05'),
 (17,6,'adjustment',1,'CYCLE-3','2026-10-31'),
 (18,8,'purchase',5,'PO-1008','2026-09-29'),(19,8,'sale',-2,'ORD-5','2026-10-12'),
 (20,9,'purchase',12,'PO-1009','2026-09-26'),(21,9,'sale',-1,'ORD-4','2026-10-10'),
 (22,10,'purchase',8,'PO-1010','2026-09-30'),(23,10,'sale',-1,'ORD-6','2026-10-20'),
 (24,10,'return',1,'RET-2','2026-11-10'),(25,10,'adjustment',-2,'CYCLE-4','2026-10-31'),
 (26,11,'purchase',20,'PO-1011','2026-09-29'),(27,11,'sale',-2,'ORD-7','2026-10-22'),
 (28,12,'purchase',8,'PO-1012','2026-09-30'),(29,12,'adjustment',-1,'CYCLE-5','2026-10-31'),
 (30,13,'purchase',14,'PO-1013','2026-09-24'),(31,13,'adjustment',-2,'CYCLE-6','2026-10-31'),
 (32,14,'purchase',8,'PO-1014','2026-09-28'),(33,14,'sale',-1,'ORD-10','2026-11-02');

INSERT INTO vendor_payouts VALUES
 (1,1,'2026-10-01','2026-10-31',3190000,319000,450000,2421000,'paid','2026-11-05'),
 (2,2,'2026-10-01','2026-10-31',465000,46500,0,418500,'paid','2026-11-05'),
 (3,3,'2026-10-01','2026-10-31',1100000,110000,110000,880000,'pending',NULL),
 (4,4,'2026-10-01','2026-10-31',150000,15000,0,135000,'paid','2026-11-05'),
 (5,5,'2026-10-01','2026-10-31',540000,54000,320000,166000,'paid','2026-11-05');
