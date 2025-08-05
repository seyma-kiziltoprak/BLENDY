const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
    [name, email, hash],
    function(err) {
      if (err) {
        
        if (err.message.includes("SQLITE_CONSTRAINT")) {
          return res.status(400).json({ message: "Bu e-posta adresi zaten kullanımda." });
        }
        console.error("Kayıt sırasında hata oluştu:", err.message);
        return res.status(500).json({ message: "Kayıt sırasında sunucu hatası oluştu." });
      }
      
      res.status(201).json({ message: "Kayıt başarılı!", userId: this.lastID });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

 
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => { 
    if (err) {
      console.error("Giriş sırasında hata oluştu:", err.message);
      return res.status(500).json({ message: "Giriş sırasında sunucu hatası oluştu." });
    }
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Şifre yanlış" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Giriş başarılı", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  
  db.get("SELECT password FROM users WHERE id = ?", [userId], async (err, row) => { 
    if (err) {
      console.error("Veritabanı hatası:", err.message);
      return res.status(500).json({ message: "Sunucu hatası" });
    }
    if (!row) { 
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    try {
      
      const match = await bcrypt.compare(oldPassword, row.password); 
      if (!match) {
        return res.status(401).json({ message: "Eski şifre yanlış" });
      }

      
      const hash = await bcrypt.hash(newPassword, 10);

      
      db.run("UPDATE users SET password = ? WHERE id = ?", [hash, userId], function(err) { 
        if (err) {
          console.error("Güncelleme hatası:", err.message);
          return res.status(500).json({ message: "Şifre güncellenemedi" });
        }


        res.json({ message: "Şifre başarıyla değiştirildi" });
      });
    } catch (error) {
      console.error("Hash hatası veya beklenmeyen hata:", error.message);
      res.status(500).json({ message: "Sunucu hatası" });
    }
  });
};