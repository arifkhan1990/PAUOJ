/**
 * SQL production handbook: the practices a read-only SELECT judge cannot grade —
 * schema design, DDL/DDL safety, transactions, views & security, indexes, and
 * scale/dialect notes. Rendered by /sql-handbook.
 */

export type SqlHandbookSection = {
  slug: string;
  title: string;
  titleBn: string;
  summary: string;
  body: string;
};

const schemaDesignBody = `টেবিল বানানোর আগেই প্রশ্ন করো: এক সারি আসলে কী? orders-এর এক সারি একটা ঘটনা — একজন কাস্টমার এক সময়ে এক ঝাঁক পণ্য কিনল। প্রতিটি টেবিলের প্রাথমিক চাবি (PRIMARY KEY) সারিটাকে আলাদা করে চেনায়; সারোগেট চাবি (\`id INTEGER PRIMARY KEY\`) সবচেয়ে নিরাপদ, কারণ ব্যবসায়িক মান (যেমন ইমেইল) বদলাতে পারে। সম্পর্ক বোঝায় FOREIGN KEY — \`orders.customer_id REFERENCES customers(id)\` লিখলে এমন অর্ডার ঢুকতেই পারে না যার কাস্টমার নেই। এই বাধাই ডেটা বাঁচায়: NOT NULL শূন্য থেকে বাঁচায়, UNIQUE ডুপ্লিকেট থেকে, CHECK অর্থহীন মান থেকে (\`CHECK (quantity > 0)\`), FK ভাঙা সম্পর্ক থেকে। constraint মানে ডেটাবেস নিজেই নিয়ম পাহারা করে — অ্যাপ কোডের হাজার if-এর চেয়ে নির্ভরযোগ্য।

নরমালাইজেশন মানে একই তথ্য এক জায়গায় রাখা। প্রথম রূপ (1NF): প্রতিটি সারিতে প্রতিটি কলামে একটাই মান — এক কলামে কমা-দিয়ে-লেখা পণ্যের তালিকা রাখা নয়, প্রতি পণ্যের জন্য আলাদা সারি (order_items টেবিল)। দ্বিতীয় রূপ (2NF): প্রাথমিক চাবির এক টুকরোর উপর নির্ভরশীল কলাম আলাদা করা — অর্ডারের তারিখ order_items-এ নয়, orders-এ থাকবে। তৃতীয় রূপ (3NF): চাবি-নয়-এমন কলামের উপর নির্ভরশীল কলাম আলাদা — product-এর নাম order_items-এ পুনরাবৃত্ত হবে না, শুধু \`product_id\` থাকবে। লাভ: আপডেট করলে আরেক জায়গায় পুরোনো মান পড়ে থাকে না (anomaly বন্ধ), ডেটা ছোট থাকে।

ডিনরমালাইজেশন জেনে-বুঝে নিয়ম ভাঙা: রিপোর্ট দ্রুত চাইলে হিসাব করা মান জমা রাখা যায় — যেমন payments টেবিলে অর্ডারের মোট আলাদা কলামে রাখা, কিংবা ভেন্ডরের গড় রেটিং আগেই গুণে রাখা। শর্ত: লেখার সময় বাড়ে, পড়ার সময় কমে — আর দুই খাতা একসাথে আপডেট না করলে মিল ভেঙে যায়। তাই আগে নরমালাইজ করো, মাপা ধীরত্ব দেখার পরেই বাছাই করা ডিনরমালাইজেশন।

মাইগ্রেশন হলো স্কিমার পরিবর্তনের রসিদ — একটার পর একটা নাম্বার-দেওয়া ফাইল, প্রতিটি একবারই চলবে। নিয়ম: বাঁচিয়ে-বাঁচিয়ে বদলাও — আগে নতুন কলাম যোগ (NULL অনুমোদিত), তারপর ডেটা ভরাট (backfill), তারপর পুরোনো কলাম বাদ — প্রতিটি ধাপ আলাদা deploy-এ, যেন কোনো ধাপে অ্যাপ থামে না। স্কিমা বদলালে সাথে সাথে index, constraint আর ডেটা-ভরাট পরিকল্পনাও লেখো; মাইগ্রেশন ফাইল একবার চালানোর পর আর সম্পাদনা কোরো না — নতুন পরিবর্তন মানে নতুন মাইগ্রেশন।

\`\`\`sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  UNIQUE (order_id, product_id)
);
\`\`\``;

const ddlDmlBody = `DDL মানে স্কিমা গড়া-গোছানো: \`CREATE TABLE\`, \`ALTER TABLE ... ADD COLUMN\`, \`DROP TABLE\`। DML মানে সারির হিসাব: \`INSERT\`, \`UPDATE\`, \`DELETE\`। দুটোর স্বভাব আলাদা — SELECT লক্ষ লক্ষ বার চলে, DDL মাসে একবার, আর ভুল DDL পুরো টেবিল মুছে দিতে পারে। তাই DDL সবসময় মাইগ্রেশন ফাইলে, হাতে-চালানো কমান্ডে নয়।

\`INSERT\`-এ কলামের নাম স্পষ্ট লেখো — \`INSERT INTO orders (customer_id, ordered_at, status) VALUES (1, '2026-11-01', 'paid')\` — তাহলে পরে টেবিলে কলাম যোগ হলেও আচরণ বদলায় না। একাধিক সারি এক statement-এ দাও: এক হাজার আলাদা INSERT-এর বদলে এক bulk INSERT কতগুণ দ্রুত। \`UPDATE\`-এ WHERE ভুলে গেলে পুরো টেবিল বদলে যায় — তাই আগে সেই WHERE দিয়ে SELECT চালিয়ে দেখো কত সারি ধরা পড়ে, তারপর UPDATE; আর সবসময় প্রাথমিক চাবি ধরে আপডেট করো। \`DELETE\`-ও একই নিয়ম — বড় টেবিলে লক জমা এড়াতে ব্যাচে ব্যাচে মুছো (\`DELETE ... WHERE id <= 1000\` জাতীয় ধাপে)।

UPSERT মানে সারি থাকলে আপডেট, না থাকলে ঢোকানো — কার্টে পণ্য যোগের মতো কাজে এটাই সঠিক হাতিয়ার: দুই আলাদা query-র (আগে SELECT, পরে INSERT/UPDATE) মাঝের ফাঁকে অন্য কেউ একই সারি ঢুকিয়ে দিলে ডুপ্লিকেট বা ভাঙা হিসাব হয়। SQLite/PostgreSQL-এ \`INSERT ... ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = quantity + 1\`; MySQL-এ \`INSERT ... ON DUPLICATE KEY UPDATE\`। RETURNING (PostgreSQL, SQLite 3.35+) ঢোকানো সারির চাবি একই statement-এ ফেরত দেয় — ঢোকানোর পরে আবার SELECT করে id খোঁজার দরকার মেটে।

ধ্বংসাত্মক কাজে নিয়ম কঠোর: ব্যাকআপ নাও, ট্রানজেকশনের ভেতরে চালাও, আগে গুনে দেখো। \`DROP TABLE\` ও \`TRUNCATE\`-র আগে দুবার ভাবো — TRUNCATE দ্রুত কিন্তু WHERE ছাড়াই পুরো টেবিল খালি করে, DELETE ফেরানো যায় (ট্রানজেকশনে থাকলে), TRUNCATE অনেক ইঞ্জিনে রোলব্যাক-অক্ষম। প্রোডাকশনে টেবিল বদলাতে হলে rename-কৌশল ব্যবহার করো: নতুন টেবিল বানাও → ডেটা কপি → যাচাই → এক মুহূর্তে নাম বদল — তাহলে ব্যবহারকারী মাঝপথে আটকে থাকে না।

\`\`\`sql
BEGIN;
INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents)
VALUES (1, 2, 1, 220000)
ON CONFLICT (cart_id, product_id)
DO UPDATE SET quantity = cart_items.quantity + 1
RETURNING id, quantity;
COMMIT;
\`\`\``;

const transactionsBody = `ট্রানজেকশন মানে "সব হবে, নাহলে কিছুই হবে না"। পেমেন্ট সফল হলে অর্ডার paid হবে আর স্টক কমবে — তিনটির একটাও বাদ গেলে হিসাব ভাঙবে; তাই তিনটিকে এক ট্রানজেকশনে বাঁধো। ACID চারটি প্রতিশ্রুতি: Atomic (সব-না-কিছু), Consistent (constraint সবসময় খাটে), Isolated (একসাথে চলা দুই ট্রানজেকশন একে অন্যকে নোংরা করতে পারে না), Durable (COMMIT-এর পর কারেন্ট বন্ধ হলেও কাজ হারায় না)। লেখা সহজ: \`BEGIN\` দিয়ে শুরু, সব ঠিক গেলে \`COMMIT\`, কোথাও ভুল হলে \`ROLLBACK\` — আর অ্যাপ কোডে ব্যতিক্রম ধরা পড়লে সবসময় রোলব্যাক করো। ধাপে ধাপে আংশিক ফেরাতে \`SAVEPOINT sp1\` দাও, ভুল হলে \`ROLLBACK TO sp1\` — বাকি কাজ বাঁচিয়ে শুধু ওই ধাপটা আবার চালাও।

একসাথে চলা ট্রানজেকশন কতটা আলাদা থাকবে, সেটা isolation level ঠিক করে। সাধারণ চার স্তরে চার ধরনের anomaly দেখা দিতে পারে: dirty read (অন্যের অসমাপ্ত কাজ পড়া), non-repeatable read (একই সারি দুবার পড়লে ভিন্ন মান), phantom read (একই ফিল্টারে দ্বিতীয়বার নতুন সারি), serialization anomaly (একসাথে চালালে অসম্ভব ফল)। Read committed (PostgreSQL-এ ডিফল্ট) dirty read আটকায় কিন্তু বাকি তিনটি ঢোকে; repeatable read আরও শক্ত; serializable সব আটকায় কিন্তু ধীর আর মাঝে মাঝে পুনরায়-চালানো লাগে। SQLite ডিফল্টে সিরিয়ালাইজডের মতো আচরণ করে (এক লেখক একসাথে)। স্তর বাছাই করো কাজের শর্ত ধরে — টাকার হিসাবে সর্বোচ্চ, সাধারণ রিপোর্টে ঢিলা।

লক আর deadlock: এক সারিতে দুই লেখক একসাথে ঢুকতে পারে না — দ্বিতীয়জন অপেক্ষা করে। অপেক্ষা ঘুরপাক খেলে deadlock: ট্রানজেকশন A সারি ১ ধরে সারি ২ চায়, B সারি ২ ধরে সারি ১ চায় — ইঞ্জিন একজনকে মেরে ফেলে (rollback) ছিঁড়ে দেয়। প্রতিকার: সব ট্রানজেকশনে টেবিল/সারি একই ক্রমে ধরো, ট্রানজেকশন ছোট রাখো (ভেতরে নেটওয়ার্ক কল নয়), আর লক-অপেক্ষায় timeout দাও।

অ্যাপ্লিকেশনের দায়িত্ব: deadlock বা serialization failure সাধারণ দুর্ঘটনা, ভুল নয় — ধরে পড়ে ছোট backoff-এ (যেমন ২৫০ms, ৫০০ms) আবার চালাও, ২–৩ বার ব্যর্থ হলে ব্যবহারকারীকে জানাও। retry করবে শুধু পড়ার কাজ বা যে লেখার পুরোটা নিরাপদে আবার চলে — পাশাপাশি দুই ক্লায়েন্ট এক সারি বদলালে শেষ-লেখা-জেতে ভাবো।

\`\`\`sql
BEGIN;
UPDATE products SET stock = stock - 1 WHERE id = 2 AND stock > 0;
-- স্টক শূন্য হলে উপরের সারি ০টি বদলাবে: সেটাই ব্যর্থতার সংকেত
SAVEPOINT charge;
UPDATE payments SET status = 'paid' WHERE order_id = 11;
ROLLBACK TO charge;
COMMIT;
\`\`\``;

const viewsSecurityBody = `View হলো নাম-দেওয়া, ভাঁড়ারোয়া query — \`CREATE VIEW october_orders AS SELECT ...\` লিখলে পরে সবাই সেটাকে টেবিলের মতো পড়ে। উপকার: জটিল JOIN একবার লেখা হয়, সব রিপোর্ট একই সংজ্ঞা ব্যবহার করে, আর স্কিমা বদলালে শুধু view-টা ঠিক করলেই চলে। Materialized view আরও এক ধাপ: ফলাফল ডিস্কে জমা থাকে, তাই ভারী অ্যাগ্রিগেশন প্রতি পড়ায় নয় — মাঝে মাঝে \`REFRESH\` (PostgreSQL: \`REFRESH MATERIALIZED VIEW\`) করতে হয়, টাটকা ডেটা চাইলে সাধারণ view-ই ঠিক।

ভূমিকা (role) আর অনুমতি: প্রতিটি অ্যাপ-সংযোগ নিজস্ব ভূমিকায় ঢোকে — \`CREATE ROLE app_readonly\`; \`GRANT SELECT ON orders TO app_readonly\`। ন্যূনতম অনুমতির নিয়ম: রিপোর্টিং সংযোগকে শুধু পড়া, অ্যাপকে যে টেবিলে দরকার শুধু সেগুলোতে লেখা, admin-কে সব — আর কখনোই অ্যাপকে মালিক (owner) করে দিও না, কারণ মালিক DROP-ও চালাতে পারে। ভূমিকা গুছিয়ে রাখলে কে কী পারে তার হিসাব এক জায়গায় থাকে, কোডের হাজার জায়গায় নয়।

Row-level security (RLS) প্রতি সারিতে নিজস্ব তালা: PostgreSQL-এ \`ENABLE ROW LEVEL SECURITY\` দিয়ে নিয়ম বাঁধো — যেমন ভেন্ডর-ভূমিকা শুধু নিজের \`vendor_id\`-এর পণ্য দেখবে। বহু-ভাড়াটিয়া (multi-tenant) সিস্টেমে প্রতিটি query-তে \`WHERE vendor_id = current\` লিখতে ভুলে যাওয়ার ঝুঁকি RLS এক জায়গায় গুটিয়ে দেয় — নিয়ম ভুলে গেলেও সারি আস্তাকাঁড়া আটকে যায়।

SQL ইনজেকশন এখনো ওয়েবের সবচেয়ে সাধারণ ছিদ্র: ইনপুটের ভেতরে quote ঢুকিয়ে query-র কাঠামো বদলে দেওয়া — \`'; DROP TABLE orders; --\` জাতীয়। প্রতিকার একটাই: মান কখনো string-এ জোড়া দিও না; parameterized statement ব্যবহার করো — \`WHERE name = ?\` আর মান আলাদা পাঠাও, তাহলে ইঞ্জিন মানটা কখনোই কোড ভাবে না। শনাক্তকরণ সহজ: query-তে string concatenation (\`"... " + name\`), format/interpolation দেখলেই সংশয়ী হও। ডেটাবেস অ্যাপের একমাত্র বিশ্বাসকেন্দ্র নয় — কিন্তু সবচেয়ে মূল্যবান সম্পদ, তাই চাবি পর্যন্ত সেখানেই তালা চাই।

\`\`\`sql
CREATE ROLE report_reader NOLOGIN;
GRANT SELECT ON october_orders TO report_reader;

CREATE POLICY vendor_isolation ON products
  FOR SELECT USING (vendor_id = current_vendor_id());
\`\`\``;

const indexesPlansBody = `Index টেবিলের পাশে একটা ক্রম-সাজানো খোঁজ-বই: B-tree-র পাতায় কলামের মান বাঁয় থেকে ডানে সাজানো, প্রতিটির পাশে সারির ঠিকানা। খোঁজ O(log n) — কোটি সারিতেও মাত্র কয়েক ধাপ। কিন্তু index বিনামূল্যে নয়: প্রতিটি INSERT/UPDATE/DELETE-তে সব index-ও আপডেট হয়, ডিস্কে জায়গা নেয় — তাই যে কলামে সত্যিই ফিল্টার বা sort হয়, শুধু সেখানেই index দাও।

কম্পোজিট index একাধিক কলামে: \`CREATE INDEX idx_orders ON orders (status, ordered_at)\`। নিয়ম: equality কলাম আগে, range কলাম পরে — কারণ বাঁয়ের কলাম স্থির হলে ডানের কলামের ভেতরে রেঞ্জ খোঁজা যায়; উল্টো সাজালে ডান কলামের রেঞ্জ বাঁয়ের সব মানে ছড়িয়ে পড়ে। আর মনে রেখো: বাঁয়ের prefix একাও ব্যবহার হয়, ডানের কলাম একা নয় — \`(status, ordered_at)\` থেকে শুধু ordered_at দিয়ে খুঁজলে index মরে। কভারিং index query-র সব দরকারি কলাম index-এই রাখে — \`SELECT ordered_at FROM orders WHERE status='paid'\` যদি \`(status, ordered_at)\` index দিয়ে চলে, টেবিলে নামতেই হয় না (index-only scan) — দ্রুততম পড়া। Partial index শর্তসাপেক্ষ: \`CREATE INDEX ... ON orders (ordered_at) WHERE status = 'paid'\` — শুধু দরকারি অংশের index, ছোট ও দ্রুত। Expression index ফাংশনের ফলেই তালা দেয়: \`CREATE INDEX ... ON customers (LOWER(name))\` — তখন \`WHERE LOWER(name) = 'rahim'\` index পায়।

EXPLAIN ANALYZE প্ল্যানের সত্যিকার মাপ: কোন index, কোন join কৌশল, প্রতি ধাপে কত সারি, কত মিলিসেকেন্ড। পড়ার নিয়ম: উপর থেকে নিচে ধাপগুলো জোড়া লাগার ক্রম; \`Seq Scan\` মানে পুরো টেবিল পড়া, \`Index Scan\`/\`Index Only Scan\` মানে খোঁজ-বই ধরে হাঁটা; আর "rows" অনুমান বাস্তবের সাথে না মিললে বোঝো statistics পুরোনো — \`ANALYZE\` চালিয়ে আবার দেখো। প্ল্যানই বলে দেয় কোথায় সময় যাচ্ছে; অনুমানে টিউন করা বনাম মাপা প্ল্যানে টিউন করা — দ্বিতীয়টাই সস্তা।

sargability নিয়মের সার: ফিল্টারে কলাম যতটা সম্ভব অপরিবর্তিত থাকে। \`ordered_at >= '2026-10-01' AND ordered_at < '2026-11-01'\` index-friendly; \`strftime('%Y-%m', ordered_at) = '2026-10'\` প্রতি সারিতে ফাংশন চালিয়ে index বাতিল করে। একই যুক্তি: টাইপ মেলাও (\`'2026-10-10'\` তারিখ-কলামে), এবং LIKE-এর wildcard শেষে রাখো — \`'key%'\` index পায়, \`'%key'\` পায় না।

\`\`\`sql
EXPLAIN ANALYZE
SELECT o.id, cu.name FROM orders o
JOIN customers cu ON cu.id = o.customer_id
WHERE o.status = 'paid'
  AND o.ordered_at >= '2026-10-01' AND o.ordered_at < '2026-11-01';

CREATE INDEX idx_orders_status_date ON orders (status, ordered_at);
ANALYZE orders;
\`\`\``;

const scaleDialectsBody = `টেবিল যখন শত কোটি সারিতে পৌঁছায়, একটাই ঘরে সব রাখা আর চলে না। Partitioning টেবিলকে টুকরোয় ভাগ করে — সাধারণত সময় ধরে: প্রতি মাসের অর্ডার আলাদা partition-এ (PostgreSQL: \`PARTITION BY RANGE (ordered_at)\`)। লাভ: মাসের query শুধু সেই মাসের টুকরো পড়ে, পুরোনো মাসের backup/drop এক কমান্ডে, আর index প্রতি টুকরোয় ছোট থাকে। বিকল্প সিঁড়ি: আগে কভারিং index আর keyset pagination শোধ করো — বেশির ভাগ "স্কেল সমস্যা" আসলে অ-optimized query।

টেক্সট সার্চে LIKE ছোট ডেটায় ঠিক, বড় ডেটায় নয় — \`LIKE '%phone%'\` পুরো টেবিল স্ক্যান করে। Full-text search এর জন্য বানানো: PostgreSQL-এ \`tsvector\` + GIN index (\`to_tsvector('english', name) @@ plainto_tsquery('phone case')\`), SQLite-এ FTS5 ভার্চুয়াল টেবিল, MySQL-এ FULLTEXT index — সবাই শব্দ-ভিত্তিক খোঁজ, র‍্যাংকিং আর দ্রুত সূচি দেয়।

আধুনিক কলাম-ধরন চাহিদা অনুযায়ী: UUID এলোমেলো চাবি — কোটি সারির মধ্যে সংঘর্ষ ছাড়াই আলাদা আইডি দেয়, বিতরণ-বান্ধব (কিন্তু B-tree-তে বড় ও এলোমেলো, তাই সারি-ক্রম UUID-র চেয়ে v7 জাতীয় সময়-সাজানো ধরন ভালো)। JSON কলাম নমনীয় বাড়তি বৈশিষ্ট্য রাখে — ShopSphere-এর product_attributes.attributes যেমন — কিন্তু নিয়ম: যে কলামে সবসময় ফিল্টার হয় সেটা আলাদা কলামে (brand, warranty_months), JSON-এ শুধু বিরল কী; আর JSON-এর ভেতরে ফিল্টার করলে expression index দাও। Array ও range ধরন (PostgreSQL) এক সারিতে তালিকা বা সময়-ব্যবধান রাখে — যেমন এক কুপনের একাধিক প্রযোজ্য দিন।

Stored procedure আর trigger ডেটাবেসের ভেতরেই ছোট প্রোগ্রাম: procedure একগুচ্ছ ধাপ এক কলে চালায় (নেটওয়ার্ক যাত্রা কমে), trigger ঢোকানো/বদলের সাথে সাথে নিয়ম খাটায় — যেমন products আপডেট হলে inventory_movements-এ লেজার সারি লেখা। সতর্কতা: trigger অদৃশ্য কাজ করে — debug কঠিন, নেস্টিং জট বাঁধে; তাই নিয়মটা সহজ আর গুটিয়ে রাখো।

তিন ইঞ্জিনের পার্থক্য জানা কাজে লাগে। SQLite: এক ফাইল, সার্ভার নেই, লেখা একসাথে একটাই — পড়া-ভারী ও এমবেডেড কাজে দুর্দান্ত (আমাদের জাজ এটাই)। PostgreSQL: সর্বাধিক সমৃদ্ধ — RLS, partitioning, range/JSON, RETURNING, নিখুঁত isolation; ডিফল্ট পছন্দ। MySQL: বিশাল ওয়েবে যুগ যুগ ধরে খাটা ইঞ্জিন; UPSERT-এর নাম \`ON DUPLICATE KEY UPDATE\`, RETURNING নেই (InnoDB-তে আলাদা আচরণ)। বহনযোগ্য SQL লেখার নিয়ম: প্রমিত অংশ (JOIN, GROUP BY, window function) ব্যবহার করো, ইঞ্জিন-নির্দিষ্ট চমক (টাইপ, UPSERT নাম, ফাংশন) এক জায়গায় গুছিয়ে রাখো যেন বদলাতে সহজ হয়।

\`\`\`sql
CREATE TABLE orders_2026_11 PARTITION OF orders
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
\`\`\``;

export const SQL_HANDBOOK_SECTIONS: SqlHandbookSection[] = [
  {
    slug: "schema-design",
    title: "Schema design",
    titleBn: "স্কিমা ডিজাইন",
    summary:
      "প্রাথমিক ও বহিরাগত চাবি, constraint, 1NF/2NF/3NF নরমালাইজেশন, কখন ডিনরমালাইজ করা হয়, আর নিরাপদ মাইগ্রেশনের নিয়ম।",
    body: schemaDesignBody,
  },
  {
    slug: "ddl-dml",
    title: "DDL & DML",
    titleBn: "DDL ও DML",
    summary:
      "CREATE/ALTER/DROP, INSERT/UPDATE/DELETE, UPSERT ও RETURNING — আর ধ্বংসাত্মক কাজকে নিরাপদ করার নিয়ম।",
    body: ddlDmlBody,
  },
  {
    slug: "transactions",
    title: "Transactions & locking",
    titleBn: "ট্রানজেকশন ও লক",
    summary:
      "ACID, BEGIN/COMMIT/ROLLBACK/SAVEPOINT, isolation level ও anomaly, deadlock, আর অ্যাপে retry কৌশল।",
    body: transactionsBody,
  },
  {
    slug: "views-security",
    title: "Views & security",
    titleBn: "ভিউ ও সিকিউরিটি",
    summary:
      "View ও materialized view, role/GRANT, row-level security, আর SQL ইনজেকশন থেকে বাঁচার একমাত্র পথ — parameterized query।",
    body: viewsSecurityBody,
  },
  {
    slug: "indexes-plans",
    title: "Indexes & plans",
    titleBn: "ইনডেক্স ও প্ল্যান",
    summary:
      "B-tree, composite/covering/partial/expression index, EXPLAIN ANALYZE পড়া, sargability আর statistics।",
    body: indexesPlansBody,
  },
  {
    slug: "scale-dialects",
    title: "Scale & dialects",
    titleBn: "স্কেল ও ডায়ালেক্ট",
    summary:
      "Partitioning, full-text search, UUID/JSON/array ধরন, stored procedure ও trigger, আর MySQL/PostgreSQL/SQLite পার্থক্য।",
    body: scaleDialectsBody,
  },
];
