/**
 * leitnerService.js
 * Learning Academy
 * Leitner Box Algorithm Service
 * A simpler, box-based spaced-repetition method offered as an alternative
 * to the SM-2 algorithm in spacedRepetitionService.js. Correct answers move
 * a word up one box; incorrect answers send it back to box 1. Each box has
 * its own fixed review interval.
 */

import { Op } from "sequelize";
import LeitnerProgress from "../models/LeitnerProgress.js";

// Review interval (in days) for each box. Box 5 is "mastered" - still
// reviewed occasionally so long-term retention is checked.
const BOX_INTERVALS_DAYS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

const MIN_BOX = 1;
const MAX_BOX = 5;
const MASTERED_BOX = 5;
// A word counts as "mastered" once it has survived a few correct reviews
// in the top box, not the instant it first arrives there.
const MASTERED_STREAK = 2;

class LeitnerService {
  /**
   * محاسبه جعبه‌ی جدید بر اساس درست یا غلط بودن پاسخ
   * @param {object} progress - رکورد فعلی (box, correctStreak)
   * @param {boolean} isCorrect - آیا پاسخ درست بوده
   */
  calculateNextBox(progress, isCorrect) {
    let { box, correctStreak } = progress;

    if (isCorrect) {
      box = Math.min(box + 1, MAX_BOX);
      correctStreak += 1;
    } else {
      // پاسخ غلط: برگشت به جعبه‌ی اول
      box = MIN_BOX;
      correctStreak = 0;
    }

    const intervalDays = BOX_INTERVALS_DAYS[box];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return { box, correctStreak, nextReviewDate };
  }

  /**
   * مرور یک کلمه با روش لایتنر
   */
  async reviewWord(userId, wordId, isCorrect) {
    let progress = await LeitnerProgress.findOne({
      where: { userId, wordId },
    });

    if (!progress) {
      progress = await LeitnerProgress.create({
        userId,
        wordId,
        box: MIN_BOX,
        correctStreak: 0,
      });
    }

    const updated = this.calculateNextBox(progress, isCorrect);

    await progress.update({
      box: updated.box,
      correctStreak: updated.correctStreak,
      lastReviewDate: new Date(),
      nextReviewDate: updated.nextReviewDate,
    });

    return progress;
  }

  /**
   * دریافت کلماتی که زمان مرورشان (با روش لایتنر) رسیده
   */
  async getDueWords(userId) {
    return await LeitnerProgress.findAll({
      where: {
        userId,
        nextReviewDate: {
          [Op.lte]: new Date(),
        },
      },
      order: [["nextReviewDate", "ASC"]],
    });
  }

  /**
   * دریافت آمار مرور کلمات با روش لایتنر
   */
  async getReviewStats(userId) {
    const totalWords = await LeitnerProgress.count({ where: { userId } });

    const dueWords = await LeitnerProgress.count({
      where: {
        userId,
        nextReviewDate: { [Op.lte]: new Date() },
      },
    });

    const masteredWords = await LeitnerProgress.count({
      where: {
        userId,
        box: MASTERED_BOX,
        correctStreak: { [Op.gte]: MASTERED_STREAK },
      },
    });

    // تعداد کلمات در هر جعبه (برای نمایش گرافیکی جعبه‌ها)
    const boxCounts = {};
    for (let b = MIN_BOX; b <= MAX_BOX; b++) {
      boxCounts[b] = await LeitnerProgress.count({ where: { userId, box: b } });
    }

    return {
      totalWords,
      dueWords,
      masteredWords,
      boxCounts,
    };
  }
}

export default new LeitnerService();
