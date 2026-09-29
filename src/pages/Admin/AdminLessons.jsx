/**
 * AdminLessons.jsx
 * Path: src/pages/Admin/AdminLessons.jsx
 * Description: Admin lessons management with JSON editor
 * Version: 2.1 - Fixed API endpoints
 * Features:
 * - ✅ Lessons list with search/filter
 * - ✅ Inline JSON editor
 * - ✅ Create new lesson
 * - ✅ Edit lesson content
 * - ✅ Publish/unpublish using correct endpoint
 * - ✅ Delete with confirmation
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Code,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  FileJson,
} from "lucide-react";
import api from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Dialog from "../../components/ui/Dialog";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "../../utils/helpers";

const AdminLessons = () => {
  const toast = useToast();
  const { language } = useLanguage();
  const isFa = language === "fa";
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [editingLesson, setEditingLesson] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState("form");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [jsonContent, setJsonContent] = useState("");
  const [jsonError, setJsonError] = useState(null);

  // ============================================
  // 📡 Fetch Lessons
  // ============================================

  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/lessons");
      if (response.data.success) {
        setLessons(response.data.data || []);
      }
    } catch (err) {
      toast.error(isFa ? "خطا در بارگذاری درس‌ها" : "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // ============================================
  // 🔍 Filter
  // ============================================

  const filteredLessons = lessons.filter((lesson) => {
    if (levelFilter !== "all" && lesson.level !== levelFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        lesson.id?.toLowerCase().includes(term) ||
        lesson.title?.fa?.toLowerCase().includes(term) ||
        lesson.title?.en?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // ============================================
  // ✏️ Open Editor
  // ============================================

  const handleOpenEditor = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({ ...lesson });
      setJsonContent(JSON.stringify(lesson, null, 2));
    } else {
      setEditingLesson(null);
      setLessonForm({
        id: "",
        title: { fa: "", en: "", de: "" },
        level: "A1",
        order: lessons.length + 1,
        isActive: true,
        sections: [],
      });
      setJsonContent("");
    }
    setEditorMode("form");
    setShowEditor(true);
  };

  // ============================================
  // 💾 Save Lesson
  // ============================================

  const handleSaveLesson = async () => {
    try {
      let data = lessonForm;

      if (editorMode === "json") {
        try {
          data = JSON.parse(jsonContent);
          setJsonError(null);
        } catch (err) {
          setJsonError(
            (isFa ? "JSON نامعتبر: " : "Invalid JSON: ") + err.message,
          );
          return;
        }
      }

      if (editingLesson) {
        await api.put(`/admin/lessons/${editingLesson.id}`, data);
        toast.success(isFa ? "درس به‌روزرسانی شد" : "Lesson updated");
      } else {
        await api.post("/admin/lessons", data);
        toast.success(isFa ? "درس جدید ایجاد شد" : "New lesson created");
      }

      setShowEditor(false);
      fetchLessons();
    } catch (err) {
      toast.error(isFa ? "خطا در ذخیره درس" : "Failed to save lesson");
    }
  };

  // ============================================
  // 🗑️ Delete Lesson
  // ============================================

  const handleDeleteLesson = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/lessons/${deleteTarget.id}`);
      toast.success(isFa ? "درس حذف شد" : "Lesson deleted");
      setDeleteTarget(null);
      fetchLessons();
    } catch (err) {
      toast.error(isFa ? "خطا در حذف درس" : "Failed to delete lesson");
    }
  };

  // ============================================
  // 🔄 Toggle Publish - ✅ FIXED
  // ============================================

  const handleTogglePublish = async (lesson) => {
    try {
      const newStatus = lesson.status === "published" ? "draft" : "published";
      // ✅ FIXED: استفاده از endpoint صحیح
      await api.post(`/admin/lessons/${lesson.id}/status`, {
        status: newStatus,
      });
      toast.success(
        lesson.status === "published"
          ? isFa
            ? "درس غیرفعال شد"
            : "Lesson unpublished"
          : isFa
            ? "درس منتشر شد"
            : "Lesson published",
      );
      fetchLessons();
    } catch (err) {
      toast.error(isFa ? "خطا در تغییر وضعیت" : "Failed to change status");
    }
  };

  // ============================================
  // 🔄 Switch Editor Mode
  // ============================================

  const handleSwitchMode = (mode) => {
    if (mode === "json" && editorMode === "form") {
      setJsonContent(JSON.stringify(lessonForm, null, 2));
    } else if (mode === "form" && editorMode === "json") {
      try {
        const parsed = JSON.parse(jsonContent);
        setLessonForm(parsed);
        setJsonError(null);
      } catch (err) {
        setJsonError(
          isFa
            ? "JSON نامعتبر است. نمی‌توان به حالت فرم بازگشت."
            : "Invalid JSON. Cannot switch back to form mode.",
        );
        return;
      }
    }
    setEditorMode(mode);
  };

  // ============================================
  // 🖼️ Render
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <Skeleton variant="card" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isFa ? "مدیریت درس‌ها" : "Manage Lessons"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isFa
              ? `${lessons.length} درس موجود`
              : `${lessons.length} lessons available`}
          </p>
        </div>

        <Button icon={Plus} onClick={() => handleOpenEditor()}>
          {isFa ? "درس جدید" : "New Lesson"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={isFa ? "جستجوی درس..." : "Search lessons..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
            clearable
            onClear={() => setSearch("")}
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        >
          <option value="all">{isFa ? "همه سطوح" : "All Levels"}</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <EmptyState
          icon={FileJson}
          title={isFa ? "درسی یافت نشد" : "No lessons found"}
          description={
            isFa
              ? "اولین درس را ایجاد کنید یا فیلترها را تغییر دهید"
              : "Create your first lesson or change the filters"
          }
          actionLabel={isFa ? "ایجاد درس جدید" : "Create New Lesson"}
          onAction={() => handleOpenEditor()}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  ID
                </th>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  {isFa ? "عنوان" : "Title"}
                </th>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  {isFa ? "سطح" : "Level"}
                </th>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  {isFa ? "ترتیب" : "Order"}
                </th>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  {isFa ? "وضعیت" : "Status"}
                </th>
                <th className="p-3 text-right text-xs font-medium text-neutral-500">
                  {isFa ? "عملیات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                >
                  <td className="p-3 text-xs font-mono">{lesson.id}</td>
                  <td className="p-3 text-sm">
                    {lesson.title?.fa || lesson.title?.en}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950 text-primary-600 rounded text-xs">
                      {lesson.level}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{lesson.order}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        lesson.status === "published"
                          ? "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
                      )}
                    >
                      {lesson.status === "published"
                        ? isFa
                          ? "منتشر شده"
                          : "Published"
                        : isFa
                          ? "پیش‌نویس"
                          : "Draft"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={Edit}
                        onClick={() => handleOpenEditor(lesson)}
                        ariaLabel={isFa ? "ویرایش" : "Edit"}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={lesson.status === "published" ? EyeOff : Eye}
                        onClick={() => handleTogglePublish(lesson)}
                        ariaLabel={
                          lesson.status === "published"
                            ? isFa
                              ? "غیرفعال‌سازی"
                              : "Unpublish"
                            : isFa
                              ? "انتشار"
                              : "Publish"
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={Trash2}
                        onClick={() => setDeleteTarget(lesson)}
                        ariaLabel={isFa ? "حذف" : "Delete"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        title={
          editingLesson
            ? isFa
              ? `ویرایش درس: ${editingLesson.id}`
              : `Edit Lesson: ${editingLesson.id}`
            : isFa
              ? "درس جدید"
              : "New Lesson"
        }
        size="2xl"
      >
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex gap-2">
            <Button
              variant={editorMode === "form" ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSwitchMode("form")}
            >
              {isFa ? "ویرایشگر فرم" : "Form Editor"}
            </Button>
            <Button
              variant={editorMode === "json" ? "primary" : "secondary"}
              size="sm"
              icon={Code}
              onClick={() => handleSwitchMode("json")}
            >
              {isFa ? "ویرایشگر JSON" : "JSON Editor"}
            </Button>
          </div>

          {/* Form Mode */}
          {editorMode === "form" && lessonForm && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={isFa ? "شناسه درس" : "Lesson ID"}
                  value={lessonForm.id || ""}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, id: e.target.value })
                  }
                  disabled={Boolean(editingLesson)}
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {isFa ? "سطح" : "Level"}
                  </label>
                  <select
                    value={lessonForm.level || "A1"}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, level: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  >
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label={isFa ? "عنوان (فارسی)" : "Title (Persian)"}
                value={lessonForm.title?.fa || ""}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    title: { ...lessonForm.title, fa: e.target.value },
                  })
                }
              />

              <Input
                label={isFa ? "عنوان (انگلیسی)" : "Title (English)"}
                value={lessonForm.title?.en || ""}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    title: { ...lessonForm.title, en: e.target.value },
                  })
                }
              />

              <Input
                label={isFa ? "ترتیب" : "Order"}
                type="number"
                value={lessonForm.order || 0}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    order: parseInt(e.target.value) || 0,
                  })
                }
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={lessonForm.isActive}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, isActive: e.target.checked })
                  }
                />
                <label htmlFor="isActive" className="text-sm">
                  {isFa ? "منتشر شده" : "Published"}
                </label>
              </div>
            </div>
          )}

          {/* JSON Mode */}
          {editorMode === "json" && (
            <div className="space-y-2">
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                rows={20}
                className="w-full p-4 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 font-mono text-sm"
                dir="ltr"
              />
              {jsonError && (
                <p className="text-sm text-danger-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {jsonError}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button variant="secondary" onClick={() => setShowEditor(false)}>
              {isFa ? "انصراف" : "Cancel"}
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveLesson}>
              {isFa ? "ذخیره" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLesson}
        title={isFa ? "حذف درس" : "Delete Lesson"}
        message={
          isFa
            ? `آیا از حذف درس "${deleteTarget?.title?.fa || deleteTarget?.id}" مطمئن هستید؟ این عمل قابل بازگشت نیست.`
            : `Are you sure you want to delete lesson "${deleteTarget?.title?.en || deleteTarget?.id}"? This action cannot be undone.`
        }
        variant="danger"
        confirmText={isFa ? "حذف" : "Delete"}
      />
    </div>
  );
};

export default AdminLessons;
