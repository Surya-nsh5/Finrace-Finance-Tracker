const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");
const { cacheMiddleware } = require("../middleware/cacheMiddleware");

const router = express.Router();

router.get("/", protect, cacheMiddleware(60), getDashboardData);

module.exports = router;