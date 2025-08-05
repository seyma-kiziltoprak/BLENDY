function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlemi yapmak için yetkiniz yok" });
  }
  next();
}

module.exports = isAdmin;
