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
