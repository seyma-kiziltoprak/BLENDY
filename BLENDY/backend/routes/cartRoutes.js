const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require("../middleware/verifyToken"); 

router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id; 


    db.all(`
        SELECT ci.cart_item_id, ci.product_id, ci.quantity, p.name, p.price, p.image, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `, [userId], (err, rows) => {
        if (err) {
            console.error("Sepet öğeleri çekilirken veritabanı hatası:", err.message);
            return res.status(500).json({ message: "Sepet öğeleri çekilirken sunucu hatası." });
        }
        res.json(rows);
    });
});


router.post('/add', authenticateToken, (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id; 


    db.get("SELECT stock FROM products WHERE id = ?", [productId], (err, productRow) => {
        if (err) {
            console.error("Stok kontrolü sırasında veritabanı hatası:", err.message);
            return res.status(500).json({ message: "Stok kontrolü sırasında sunucu hatası." });
        }
        if (!productRow) {
            return res.status(404).json({ message: "Ürün bulunamadı." });
        }
        const availableStock = productRow.stock;


        db.get("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [userId, productId], (err, row) => {
            if (err) {
                console.error("Sepet öğesi kontrolü sırasında veritabanı hatası:", err.message);
                return res.status(500).json({ message: "Sepet öğesi kontrolü sırasında sunucu hatası." });
            }

            if (row) {

                const newQuantity = row.quantity + quantity;
                if (newQuantity > availableStock) {
                    return res.status(400).json({ message: `Maksimum ${availableStock} adet ekleyebilirsiniz.` });
                }
                db.run("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?", [newQuantity, row.cart_item_id], function(err) {
                    if (err) {
                        console.error("Sepet öğesi güncellenirken veritabanı hatası:", err.message);
                        return res.status(500).json({ message: "Sepet öğesi güncellenemedi." });
                    }
                    res.status(200).json({ message: "Ürün miktarı sepetinizde güncellendi.", cartItemId: this.lastID });
                });
            } else {
                
                if (quantity > availableStock) {
                    return res.status(400).json({ message: `Maksimum ${availableStock} adet ekleyebilirsiniz.` });
                }
                db.run("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [userId, productId, quantity], function(err) {
                    if (err) {
                        console.error("Sepete ürün eklenirken veritabanı hatası:", err.message);
                        return res.status(500).json({ message: "Ürün sepete eklenemedi." });
                    }
                    res.status(201).json({ message: "Ürün sepete eklendi.", cartItemId: this.lastID });
                });
            }
        });
    });
});


router.put('/update/:cartItemId', authenticateToken, (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (quantity === undefined || quantity < 1) {
        return res.status(400).json({ message: "Geçersiz miktar değeri." });
    }


    db.get(`
        SELECT ci.product_id, p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_item_id = ? AND ci.user_id = ?
    `, [cartItemId, userId], (err, row) => {
        if (err) {
            console.error("Miktar güncelleme kontrolü sırasında veritabanı hatası:", err.message);
            return res.status(500).json({ message: "Miktar güncellenirken sunucu hatası." });
        }
        if (!row) {
            return res.status(404).json({ message: "Sepet öğesi bulunamadı veya size ait değil." });
        }

        const availableStock = row.stock;
        if (quantity > availableStock) {
            return res.status(400).json({ message: `Maksimum ${availableStock} adet mevcut.` });
        }

        db.run("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND user_id = ?", [quantity, cartItemId, userId], function(err) {
            if (err) {
                console.error("Sepet öğesi miktarı güncellenirken veritabanı hatası:", err.message);
                return res.status(500).json({ message: "Sepet öğesi miktarı güncellenemedi." });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Sepet öğesi bulunamadı veya güncellenmedi." });
            }
            res.status(200).json({ message: "Ürün miktarı başarıyla güncellendi." });
        });
    });
});


router.delete('/remove/:cartItemId', authenticateToken, (req, res) => {
    const { cartItemId } = req.params;
    const userId = req.user.id;

    db.run("DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?", [cartItemId, userId], function(err) {
        if (err) {
            console.error("Sepet öğesi silinirken veritabanı hatası:", err.message);
            return res.status(500).json({ message: "Ürün sepetten kaldırılamadı." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Sepet öğesi bulunamadı veya size ait değil." });
        }
        res.status(200).json({ message: "Ürün sepetten başarıyla kaldırıldı." });
    });
});


router.delete('/clear', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.run("DELETE FROM cart_items WHERE user_id = ?", [userId], function(err) {
        if (err) {
            console.error("Sepet temizlenirken veritabanı hatası:", err.message);
            return res.status(500).json({ message: "Sepet temizlenemedi." });
        }
        if (this.changes === 0) {
            return res.status(200).json({ message: "Sepetiniz zaten boş." }); // Sepet zaten boşsa da başarılı sayılır
        }
        res.status(200).json({ message: "Sepet başarıyla temizlendi." });
    });
});

module.exports = router;