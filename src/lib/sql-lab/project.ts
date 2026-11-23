/**
 * Multi-vendor e-commerce fixture used by the SQL lab. The schema is small on
 * purpose: every task runs against a fresh in-memory copy of this dataset.
 */
export const PROJECT_SQL = `
CREATE TABLE vendors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  rating REAL NOT NULL
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  signup_date TEXT NOT NULL
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stock INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_at TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL
);

INSERT INTO vendors VALUES
  (1, 'TechNest', 'Dhaka', 4.8),
  (2, 'BookBazar', 'Chattogram', 4.3),
  (3, 'StyleHub', 'Dhaka', 4.6),
  (4, 'GadgetPoint', 'Sylhet', 4.1),
  (5, 'HomeCraft', 'Khulna', 4.9);

INSERT INTO customers VALUES
  (1, 'Rahim', 'Dhaka', '2026-01-12'),
  (2, 'Karim', 'Chattogram', '2026-02-03'),
  (3, 'Nusrat', 'Dhaka', '2026-02-21'),
  (4, 'Sajid', 'Sylhet', '2026-03-05'),
  (5, 'Mim', 'Khulna', '2026-03-18'),
  (6, 'Tanvir', 'Dhaka', '2026-04-02');

INSERT INTO products VALUES
  (1, 1, 'Mechanical Keyboard', 'Electronics', 450000, 12),
  (2, 1, 'USB-C Hub', 'Electronics', 220000, 8),
  (3, 1, '27in Monitor', 'Electronics', 1850000, 5),
  (4, 2, 'Clean Code', 'Books', 180000, 30),
  (5, 2, 'SQL Handbook', 'Books', 95000, 9),
  (6, 3, 'Cotton Panjabi', 'Fashion', 240000, 14),
  (7, 3, 'Leather Wallet', 'Fashion', 120000, 25),
  (8, 4, 'Wireless Mouse', 'Electronics', 85000, 3),
  (9, 4, 'Laptop Stand', 'Accessories', 150000, 11),
  (10, 5, 'Clay Dinner Set', 'Home', 320000, 6),
  (11, 5, 'Table Lamp', 'Home', 110000, 18),
  (12, 1, 'Webcam', 'Electronics', 350000, 2);

INSERT INTO orders VALUES
  (1, 1, '2026-10-01', 'paid'),
  (2, 2, '2026-10-03', 'pending'),
  (3, 3, '2026-10-05', 'paid'),
  (4, 1, '2026-10-10', 'paid'),
  (5, 4, '2026-10-12', 'cancelled'),
  (6, 1, '2026-10-20', 'paid'),
  (7, 5, '2026-10-22', 'paid'),
  (8, 2, '2026-10-25', 'shipped'),
  (9, 3, '2026-10-28', 'paid');

INSERT INTO order_items VALUES
  (1, 1, 1, 1, 450000),
  (2, 1, 2, 2, 220000),
  (3, 2, 4, 1, 180000),
  (4, 3, 6, 2, 240000),
  (5, 3, 7, 1, 120000),
  (6, 4, 3, 1, 1850000),
  (7, 4, 9, 1, 150000),
  (8, 5, 8, 2, 85000),
  (9, 6, 5, 3, 95000),
  (10, 6, 10, 1, 320000),
  (11, 7, 1, 1, 450000),
  (12, 7, 11, 2, 110000),
  (13, 8, 4, 1, 180000),
  (14, 9, 7, 1, 120000);
`;

export const PROJECT_BRIEF = {
  title: "TechNest marketplace",
  summary:
    "A multi-vendor marketplace where local shops sell electronics, books, fashion and home goods. Orders, payments and stock all live in one PostgreSQL-style schema.",
  features: [
    "Vendor storefronts with ratings",
    "Product catalog with stock",
    "Orders and line items",
    "Customer history",
  ],
};

export const PROJECT_TABLES = [
  {
    name: "vendors",
    description: "Seller profiles",
    columns: "id, name, city, rating",
  },
  {
    name: "customers",
    description: "Buyers",
    columns: "id, name, city, signup_date",
  },
  {
    name: "products",
    description: "Catalog items",
    columns: "id, vendor_id, name, category, price_cents, stock",
  },
  {
    name: "orders",
    description: "Placed orders",
    columns: "id, customer_id, ordered_at, status",
  },
  {
    name: "order_items",
    description: "Line items",
    columns: "id, order_id, product_id, quantity, unit_price_cents",
  },
] as const;
