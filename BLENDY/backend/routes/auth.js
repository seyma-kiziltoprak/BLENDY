const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middleware/verifyToken");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/changePassword", verifyToken, authController.changePassword);

router.get("/test", (req, res) => {
  res.json({ message: "Auth route çalışıyor!" });
});

module.exports = router;

