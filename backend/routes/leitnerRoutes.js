/**
 * leitnerRoutes.js
 * Learning Academy
 * Leitner Box Review Routes
 */

import express from "express";

import { authenticate } from "../middlewares/authMiddleware.js";

import {
  reviewWord,
  getDueWords,
  getReviewStats,
} from "../controllers/leitnerController.js";

const router = express.Router();

router.use(authenticate);

router.get("/due", getDueWords);

router.get("/stats", getReviewStats);

router.post("/:wordId/review", reviewWord);

export default router;
