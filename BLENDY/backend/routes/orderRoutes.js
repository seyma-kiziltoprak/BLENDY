const express = require('express');
const router = express.Router();
const db = require('../db'); 
const authenticateToken = require('../middleware/verifyToken'); 


router.post('/create', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    const { shippingAddress, paymentMethod, orderNote, totalAmount, cartItems } = req.body;

    if (!shippingAddress || !paymentMethod || !totalAmount || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'Eksik veya hatalı sipariş bilgileri.' });
    }

    try {
        
        db.run(`
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, order_note)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, totalAmount, shippingAddress, paymentMethod, orderNote], function(err) {
            if (err) {
                console.error("Sipariş oluşturulurken hata:", err.message);
                return res.status(500).json({ message: 'Sipariş oluşturulurken bir hata oluştu.' });
            }

            const orderId = this.lastID; 

            
            const insertOrderItemPromises = cartItems.map(item => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO order_items (order_id, product_id, quantity, price)
                        VALUES (?, ?, ?, ?)
                    `, [orderId, item.product_id, item.quantity, item.price], function(err) {
                        if (err) {
                            console.error("Sipariş öğesi eklenirken hata:", err.message);
                            return reject(err);
                        }
                       
                        db.run(`
                            UPDATE products
                            SET stock = stock - ?
                            WHERE id = ?
                        `, [item.quantity, item.product_id], function(updateErr) {
                            if (updateErr) {
                                console.error("Stok güncellenirken hata:", updateErr.message);
                                return reject(updateErr);
                            }
                            resolve();
                        });
                    });
                });
            });

            Promise.all(insertOrderItemPromises)
                .then(() => {
                    
                    db.run(`DELETE FROM cart_items WHERE user_id = ?`, [userId], function(err) {
                        if (err) {
                            console.error("Sepet temizlenirken hata:", err.message);
                           
                        }
                        res.status(201).json({ message: 'Sipariş başarıyla oluşturuldu!', orderId: orderId });
                    });
                })
                .catch(error => {

                    console.error("Sipariş öğeleri işlenirken hata:", error.message);
                    res.status(500).json({ message: 'Sipariş oluşturulurken bir hata oluştu.', error: error.message });
                });
        });
    } catch (error) {
        console.error("Genel sipariş hatası:", error);
        res.status(500).json({ message: "Sunucu hatası oluştu." });
    }
});


router.get('/', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(`
        SELECT
            o.order_id,
            o.order_date,
            o.total_amount,
            o.status,
            o.shipping_address,
            o.payment_method,
            o.order_note,
            GROUP_CONCAT(json_object(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price,
                'image', p.image
            )) AS items_json
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.order_id
        ORDER BY o.order_date DESC
    `, [userId], (err, rows) => {
        if (err) {
            console.error("Siparişler çekilirken hata:", err.message);
            return res.status(500).json({ message: "Sipariş geçmişi alınırken sunucu hatası." });
        }


        const orders = rows.map(row => {
            return {
                ...row,
                items: JSON.parse(`[${row.items_json}]`) 
            };
        });

        res.json(orders);
    });
});


router.get('/:orderId', authenticateToken, (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    db.get(`
        SELECT
            o.order_id,
            o.order_date,
            o.total_amount,
            o.status,
            o.shipping_address,
            o.payment_method,
            o.order_note,
            GROUP_CONCAT(json_object(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price,
                'image', p.image
            )) AS items_json
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.order_id = ? AND o.user_id = ?
        GROUP BY o.order_id
    `, [orderId, userId], (err, row) => {
        if (err) {
            console.error("Sipariş detayı çekilirken hata:", err.message);
            return res.status(500).json({ message: "Sipariş detayı alınırken sunucu hatası." });
        }
        if (!row) {
            return res.status(404).json({ message: "Sipariş bulunamadı veya size ait değil." });
        }

        const orderDetail = {
            ...row,
            items: JSON.parse(`[${row.items_json}]`)
        };
        res.json(orderDetail);
    });
});


module.exports = router;