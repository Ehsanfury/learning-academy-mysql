/**
 * lessonService.test.js
 * Path: backend/services/__tests__/lessonService.test.js
 * Description: Tests for lessonService
 * Version: 1.0 - New test file
 * Coverage:
 * - ✅ Get lessons (with filters)
 * - ✅ Get single lesson
 * - ✅ Complete lesson (XP award)
 * - ✅ Check lesson lock
 * - ✅ Calculate score
 * - ✅ Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// 🎭 Mocks
// ============================================

vi.mock("../../models/index.js", () => ({
  Lesson: {
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
  },
  LessonProgress: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    findOrCreate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  User: { findByPk: vi.fn() },
  XPHistory: { create: vi.fn() },
}));

vi.mock("../../services/userService.js", () => ({
  default: {
    addXP: vi.fn(),
    updateLevel: vi.fn(),
  },
}));

vi.mock("../../services/achievementService.js", () => ({
  default: {
    checkAndAwardAchievements: vi.fn().mockResolvedValue({ count: 0 }),
  },
}));

vi.mock("../../services/streakService.js", () => ({
  default: {
    logDailyActivity: vi.fn().mockResolvedValue({ streak: 1 }),
  },
}));

vi.mock("../../config/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { Lesson, LessonProgress } from "../../models/index.js";
import userService from "../../services/userService.js";
import achievementService from "../../services/achievementService.js";
import lessonService from "../lessonService";

// ============================================
// 🧪 Tests
// ============================================

describe("LessonService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================
  // 📚 Get Lessons
  // ============================================

  describe("getLessons", () => {
    it("should return lessons with progress for authenticated user", async () => {
      const mockLessons = [
        { id: "a1-l01", toJSON: () => ({ id: "a1-l01", title: "Lesson 1" }) },
        { id: "a1-l02", toJSON: () => ({ id: "a1-l02", title: "Lesson 2" }) },
      ];
      const mockProgress = [
        {
          lessonId: "a1-l01",
          toJSON: () => ({ lessonId: "a1-l01", completed: true }),
        },
      ];

      Lesson.findAndCountAll.mockResolvedValue({
        rows: mockLessons,
        count: 2,
      });
      LessonProgress.findAll.mockResolvedValue(mockProgress);

      const result = await lessonService.getLessons({
        userId: 1,
        level: "A1",
      });

      expect(result.lessons).toHaveLength(2);
      expect(result.lessons[0]).toHaveProperty("progress");
      expect(result.total).toBe(2);
    });

    it("should return lessons without progress for guest user", async () => {
      const mockLessons = [{ id: "a1-l01", toJSON: () => ({ id: "a1-l01", title: "Lesson 1" }) }];

      Lesson.findAndCountAll.mockResolvedValue({
        rows: mockLessons,
        count: 1,
      });

      const result = await lessonService.getLessons({ userId: null });

      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0]).not.toHaveProperty("progress");
    });

    it("should filter by search term", async () => {
      Lesson.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await lessonService.getLessons({
        userId: 1,
        search: "greeting",
      });

      const callArgs = Lesson.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      Lesson.findAndCountAll.mockRejectedValue(new Error("DB error"));

      const result = await lessonService.getLessons({ userId: 1 });

      expect(result.lessons).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // 📖 Get Single Lesson
  // ============================================

  describe("getLesson", () => {
    it("should return lesson by ID", async () => {
      const mockLesson = {
        id: "a1-l01",
        toJSON: () => ({ id: "a1-l01", title: "Lesson 1", sections: [] }),
      };
      Lesson.findByPk.mockResolvedValue(mockLesson);
      LessonProgress.findOne.mockResolvedValue(null);

      const result = await lessonService.getLessonById("a1-l01", 1);

      expect(result.id).toBe("a1-l01");
    });

    it("should return null when lesson not found", async () => {
      Lesson.findByPk.mockResolvedValue(null);

      const result = await lessonService.getLessonById("invalid", 1);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // 🔒 Lesson Lock Check
  // ============================================

  describe("checkLessonLock", () => {
    it("should allow access to a lesson with no prerequisites", async () => {
      const mockLesson = {
        id: "a1-l01",
        level: "A1",
        isActive: true,
        status: "published",
        prerequisites: [],
      };
      Lesson.findByPk.mockResolvedValue(mockLesson);

      const result = await lessonService.checkLessonLock(1, "a1-l01");

      expect(result.locked).toBe(false);
    });

    it("should lock lesson if prerequisite lesson not completed", async () => {
      const mockLesson = {
        id: "a1-l02",
        level: "A1",
        isActive: true,
        status: "published",
        prerequisites: ["a1-l01"],
      };
      Lesson.findByPk.mockResolvedValue(mockLesson);
      LessonProgress.count.mockResolvedValue(0); // prerequisite not completed

      const result = await lessonService.checkLessonLock(1, "a1-l02");

      expect(result.locked).toBe(true);
    });

    it("should unlock lesson if prerequisite lesson completed", async () => {
      const mockLesson = {
        id: "a1-l02",
        level: "A1",
        isActive: true,
        status: "published",
        prerequisites: ["a1-l01"],
      };
      Lesson.findByPk.mockResolvedValue(mockLesson);
      LessonProgress.count.mockResolvedValue(1); // prerequisite completed

      const result = await lessonService.checkLessonLock(1, "a1-l02");

      expect(result.locked).toBe(false);
    });
  });

  // ============================================
  // ✅ Complete Lesson
  // ============================================

  describe("completeLesson", () => {
    const mockLesson = {
      id: "a1-l01",
      level: "A1",
      xpReward: 50,
      sections: [
        {
          questions: [{ id: "q1", type: "multiple_choice", correctIndex: 0 }],
        },
      ],
    };

    beforeEach(() => {
      Lesson.findByPk.mockResolvedValue(mockLesson);
    });

    it("should award XP on lesson completion with valid score", async () => {
      const mockProgress = { update: vi.fn().mockResolvedValue({}) };
      LessonProgress.findOrCreate.mockResolvedValue([mockProgress, true]);
      userService.addXP.mockResolvedValue({ xp: 150, level: 1 });

      const result = await lessonService.completeLesson({
        userId: 1,
        lessonId: "a1-l01",
        answers: { q1: 0 }, // correct -> 100% score
      });

      expect(userService.addXP).toHaveBeenCalledWith(1, 50, "lesson_completion");
      expect(result.xpEarned).toBe(50);
      expect(result.isPassed).toBe(true);
    });

    it("should not award XP if score is below passing threshold", async () => {
      const mockProgress = { update: vi.fn().mockResolvedValue({}) };
      LessonProgress.findOrCreate.mockResolvedValue([mockProgress, true]);

      const result = await lessonService.completeLesson({
        userId: 1,
        lessonId: "a1-l01",
        answers: { q1: 999 }, // wrong -> 0% score
      });

      expect(userService.addXP).not.toHaveBeenCalled();
      expect(result.xpEarned).toBe(0);
    });

    it("should check achievements after completion", async () => {
      const mockProgress = { update: vi.fn().mockResolvedValue({}) };
      LessonProgress.findOrCreate.mockResolvedValue([mockProgress, true]);
      userService.addXP.mockResolvedValue({ xp: 150, level: 1 });

      await lessonService.completeLesson({
        userId: 1,
        lessonId: "a1-l01",
        answers: { q1: 0 },
      });

      expect(achievementService.checkAndAwardAchievements).toHaveBeenCalledWith(
        1,
        "lesson_completed",
        expect.objectContaining({ lessonId: "a1-l01" })
      );
    });
  });

  // ============================================
  // 📊 Calculate Score
  // ============================================

  describe("calculateScore", () => {
    const makeLesson = (questions) => ({
      sections: [{ questions }],
    });

    it("should calculate score based on correct answers", () => {
      const lesson = makeLesson([
        { id: "q1", type: "multiple_choice", correctIndex: 0 },
        { id: "q2", type: "multiple_choice", correctIndex: 1 },
        { id: "q3", type: "multiple_choice", correctIndex: 2 },
        { id: "q4", type: "fill_in", answer: "Hallo" },
      ]);
      const answers = { q1: 0, q2: 1, q3: 0, q4: "hallo" };

      const score = lessonService.calculateScore(lesson, answers);

      expect(score).toBe(75); // 3/4 = 75%
    });

    it("should return 0 for empty answers", () => {
      const lesson = makeLesson([{ id: "q1", type: "multiple_choice", correctIndex: 0 }]);

      const score = lessonService.calculateScore(lesson, {});

      expect(score).toBe(0);
    });

    it("should return 100 for all correct", () => {
      const lesson = makeLesson([
        { id: "q1", type: "multiple_choice", correctIndex: 0 },
        { id: "q2", type: "translation", answer: "Danke" },
      ]);
      const answers = { q1: 0, q2: "danke" };

      const score = lessonService.calculateScore(lesson, answers);

      expect(score).toBe(100);
    });
  });
});
