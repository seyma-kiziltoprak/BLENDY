const sqlite3 = require("sqlite3").verbose(); 
const path = require("path"); 
require("dotenv").config(); 

const DB_PATH = path.join(__dirname, "..", "ecommerce.db");


const initialProducts = require('./products.json'); 


const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("SQLite veritabanına bağlanırken hata oluştu:", err.message);
    } else {
        console.log("SQLite veritabanına başarıyla bağlandı!");

        db.serialize(() => {
            // Kullanıcılar tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error("Kullanıcılar tablosu oluşturulurken hata:", err.message);
                else console.log("Users tablosu kontrol edildi/oluşturuldu.");
            });

            // Ürünler tablosu
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                content TEXT,
                price REAL NOT NULL,
                calorie TEXT,
                image TEXT,
                imagedetail TEXT,
                stock INTEGER NOT NULL DEFAULT 0
            )`, (err) => {
                if (err) console.error("Ürünler tablosu oluşturulurken hata:", err.message);
                else console.log("Products tablosu kontrol edildi/oluşturuldu.");
            });

            
            // Cart_items tablosu
            db.run(`
                CREATE TABLE IF NOT EXISTS cart_items (
                    cart_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    UNIQUE (user_id, product_id) -- Bir kullanıcının aynı üründen sadece bir sepet öğesi olabilir
                );
            `, (err) => {
                if (err) {
                    console.error("cart_items tablosu oluşturulurken hata:", err.message);
                } else {
                    console.log("cart_items tablosu başarıyla kontrol edildi/oluşturuldu.");
                }
            });

        // Siparişler tablosu
        db.run(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                order_date TEXT DEFAULT CURRENT_TIMESTAMP,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, completed, cancelled, preparing, shipped
                shipping_address TEXT NOT NULL,
                payment_method TEXT NOT NULL,
                order_note TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `, (err) => {
            if (err) {
                console.error("Orders tablosu oluşturulurken hata:", err.message);
            } else {
                console.log("Orders tablosu hazır.");
            }
        });

        // Sipariş Öğeleri tablosu
        db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL, -- Ürünün sipariş anındaki fiyatı
                FOREIGN KEY (order_id) REFERENCES orders(order_id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );
        `, (err) => {
            if (err) {
                console.error("Order_Items tablosu oluşturulurken hata:", err.message);
            } else {
                console.log("Order_Items tablosu hazır.");
            }
        });


            db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
                if (err) {
                    console.error("Ürün sayısını kontrol ederken hata:", err.message);
                    return;
                }
                if (row.count === 0) {

                    const stmt = db.prepare("INSERT INTO products (id, name, description, content, price, calorie, image, imagedetail, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    initialProducts.forEach(product => {
                        stmt.run(
                            product.id,
                            product.name,
                            product.description,
                            product.content, 
                            product.price,
                            product.calorie, 
                            product.image,     
                            product.imagedetail, 
                            product.stock || 100 
                        );
                    });
                    stmt.finalize();
                    console.log('Ürünler products.json dosyasından veritabanına başarıyla eklendi.');
                } else {
                    console.log('Products tablosunda zaten ürünler var. Tekrar eklenmiyor.');
                }
            });


            console.log("Veritabanı tabloları kontrol edildi ve oluşturuldu (varsa).");
        });
    }
});

module.exports = db;