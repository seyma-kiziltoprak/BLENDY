const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const db = require("../db");


router.get("/me", verifyToken, (req, res) => {
  const userId = req.user.id;

 
  db.get("SELECT id, name, email FROM users WHERE id = ?", [userId], (err, user) => { 
    if (err) {
      console.error("Kullanıcı bilgisi alınırken hata:", err.message);
      return res.status(500).json({ message: "Sunucu hatası" });
    }
    if (!user) { 
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json(user); 
  });
});

module.exports = router;