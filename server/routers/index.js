const express = require("express");
const router = express.Router();
const RecommendationController = require("../controllers/recommendationController");
const auth = require("../middlewares/authentication");

router.get("/recommendations", auth, RecommendationController.getRecommendations);

module.exports = router;
