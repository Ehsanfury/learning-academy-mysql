/**
 * LeitnerProgress.js
 * Path: backend/models/LeitnerProgress.js
 * Description: Word progress model for the Leitner box spaced-repetition
 * method - a simpler, box-based alternative to the SM-2 algorithm used by
 * WordProgress. Kept as a separate table so a user's SM-2 progress and
 * Leitner progress never collide; the app (or the user) picks which method
 * to review a word with.
 */

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const LeitnerProgress = sequelize.define(
  "LeitnerProgress",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },
    wordId: {
      type: DataTypes.STRING(50), // matches Vocabulary.id
      allowNull: false,
      field: "word_id",
    },
    box: {
      // Leitner box number: 1 (newest/hardest) through 5 (mastered)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    correctStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "correct_streak",
    },
    lastReviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_review_date",
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "next_review_date",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "leitner_progress",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id", "word_id"],
        unique: true,
      },
      {
        fields: ["user_id", "next_review_date"],
      },
    ],
  }
);

export default LeitnerProgress;
