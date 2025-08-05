const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

router.get("/dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Admin paneline hoş geldin!" });
});

module.exports = router;
