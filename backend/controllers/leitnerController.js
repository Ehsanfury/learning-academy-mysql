/**
 * leitnerController.js
 * Learning Academy
 * Leitner Box Review Controller
 */

import leitnerService from "../services/leitnerService.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { ValidationError } from "../errors/index.js";

export const reviewWord = asyncHandler(async (req, res) => {
  const { wordId } = req.params;
  const { isCorrect } = req.body;
  const userId = req.user.id;

  if (!wordId) {
    throw new ValidationError({
      message: "Word ID is required",
      details: [{ field: "wordId", message: "Word ID is required" }],
    });
  }

  if (typeof isCorrect !== "boolean") {
    throw new ValidationError({
      message: "isCorrect must be true or false",
      details: [{ field: "isCorrect", message: "isCorrect must be true or false" }],
    });
  }

  const result = await leitnerService.reviewWord(userId, wordId, isCorrect);

  res.json({
    success: true,
    message: "Word reviewed successfully",
    data: result,
  });
});

export const getDueWords = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const words = await leitnerService.getDueWords(userId);

  res.json({
    success: true,
    data: words,
  });
});

export const getReviewStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await leitnerService.getReviewStats(userId);

  res.json({
    success: true,
    data: stats,
  });
});
