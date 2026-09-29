/**
 * AdminSettingsPage.jsx
 * Path: src/pages/Admin/AdminSettingsPage.jsx
 * Description: Admin settings page with feature flags
 * Version: 2.0 - Feature flags, system settings
 * Features:
 * - ✅ Feature flags (enable/disable features)
 * - ✅ System settings (maintenance mode, registrations)
 * - ✅ Email settings
 * - ✅ AI provider settings
 * - ✅ Rate limiting config
 * - ✅ Cache management
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Flag,
  Mail,
  Bot,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import api from "../../services/api";
import Card, { CardHeader, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { useLanguage } from "../../context/LanguageContext";
import { cn } from "@utils/helpers";

const AdminSettingsPage = () => {
  const toast = useToast();
  const { language } = useLanguage();
  const isFa = language === "fa";

  const s = {
    loadErr: isFa ? "خطا در بارگذاری تنظیمات" : "Failed to load settings",
    savedOk: isFa ? "تنظیمات ذخیره شد" : "Settings saved",
    saveErr: isFa ? "خطا در {s.saveSettings}" : "Failed to save settings",
    confirmClearCache: isFa
      ? "آیا از {s.clearCache} مطمئن هستید؟"
      : "Are you sure you want to clear the cache?",
    cacheClearedOk: isFa ? "کش پاک شد" : "Cache cleared",
    cacheClearErr: isFa ? "خطا در {s.clearCache}" : "Failed to clear cache",
    title: isFa ? "تنظیمات سیستم" : "System Settings",
    subtitle: isFa ? "{s.subtitle}" : "Configure features and services",
    clearCache: isFa ? "{s.clearCache}" : "Clear Cache",
    saveSettings: isFa ? "{s.saveSettings}" : "Save Settings",
    maintenanceOn: isFa
      ? "{s.maintenanceOn}"
      : "The system is in maintenance mode",
    maintenanceOnDesc: isFa
      ? "{s.maintenanceOnDesc}"
      : "Non-admin users cannot access the system.",
    featureFlags: isFa ? "{s.featureFlags}" : "Feature Flags",
    aiTutor: isFa ? "معلم هوش مصنوعی" : "AI Tutor",
    aiTutorDesc: isFa
      ? "چت با هوش مصنوعی برای پاسخ به سؤالات"
      : "AI chat for answering questions",
    stories: isFa ? "داستان‌ها" : "Stories",
    storiesDesc: isFa ? "بخش داستان‌های تعاملی" : "Interactive stories section",
    scenarios: isFa ? "سناریوها" : "Scenarios",
    scenariosDesc: isFa
      ? "شبیه‌سازی موقعیت‌های واقعی"
      : "Real-life situation simulations",
    achievements: isFa ? "دستاوردها" : "Achievements",
    achievementsDesc: isFa
      ? "سیستم دستاوردها و نشان‌ها"
      : "Achievements and badges system",
    leaderboard: isFa ? "جدول رهبران" : "Leaderboard",
    leaderboardDesc: isFa ? "رتبه‌بندی کاربران" : "User ranking",
    mentors: isFa ? "منتورها" : "Mentors",
    mentorsDesc: isFa ? "سیستم منتورینگ انسانی" : "Human mentoring system",
    spacedRepetition: isFa ? "تکرار فاصله‌دار" : "Spaced Repetition",
    spacedRepetitionDesc: isFa
      ? "الگوریتم Spaced Repetition"
      : "Spaced repetition algorithm",
    systemSettings: isFa ? "تنظیمات سیستم" : "System Settings",
    maintenanceMode: isFa ? "حالت نگهداری" : "Maintenance Mode",
    maintenanceModeDesc: isFa
      ? "غیرفعال کردن دسترسی کاربران عادی"
      : "Disable access for regular users",
    allowRegistrations: isFa ? "اجازه ثبت‌نام" : "Allow Registrations",
    allowRegistrationsDesc: isFa
      ? "کاربران جدید می‌توانند ثبت‌نام کنند"
      : "New users can register",
    requireEmailVerification: isFa
      ? "تأیید ایمیل الزامی"
      : "Require Email Verification",
    requireEmailVerificationDesc: isFa
      ? "کاربران باید ایمیل خود را تأیید کنند"
      : "Users must verify their email",
    maxUsers: isFa ? "حداکثر تعداد کاربران" : "Maximum Number of Users",
    emailSettings: isFa ? "تنظیمات ایمیل" : "Email Settings",
    fromAddress: isFa ? "آدرس فرستنده" : "From Address",
    smtpHost: isFa ? "میزبان SMTP" : "SMTP Host",
    port: isFa ? "پورت" : "Port",
    aiSettings: isFa ? "تنظیمات هوش مصنوعی" : "AI Settings",
    provider: isFa ? "ارائه‌دهنده" : "Provider",
    model: isFa ? "مدل" : "Model",
    maxTokens: isFa ? "حداکثر توکن" : "Max Tokens",
    temperature: isFa ? "دمــا (Temperature)" : "Temperature",
    rateLimiting: isFa ? "محدودیت نرخ" : "Rate Limiting",
    generalRequests: isFa
      ? "درخواست‌های عمومی (در ۱۵ دقیقه)"
      : "General Requests (per 15 min)",
    authRequests: isFa
      ? "درخواست‌های احراز هویت (در ۱۵ دقیقه)"
      : "Auth Requests (per 15 min)",
    aiRequests: isFa ? "درخواست‌های AI (در دقیقه)" : "AI Requests (per minute)",
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    features: {
      aiTutor: true,
      stories: true,
      scenarios: true,
      achievements: true,
      leaderboard: true,
      mentors: false,
      spacedRepetition: true,
    },
    system: {
      maintenanceMode: false,
      allowRegistrations: true,
      requireEmailVerification: true,
      maxUsers: 10000,
    },
    email: {
      provider: "smtp",
      from: "noreply@learning-academy.com",
      host: "",
      port: 587,
      secure: false,
    },
    ai: {
      provider: "openai",
      apiKey: "",
      model: "gpt-4",
      maxTokens: 1000,
      temperature: 0.7,
    },
    rateLimit: {
      general: 100,
      auth: 5,
      ai: 20,
    },
  });

  // ============================================
  // 📡 Fetch Settings
  // ============================================

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/settings");
      if (response.data.success) {
        setSettings({ ...settings, ...response.data.data });
      }
    } catch (err) {
      toast.error(s.loadErr);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ============================================
  // 💾 Save Settings
  // ============================================

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put("/admin/settings", settings);
      toast.success(s.savedOk);
    } catch (err) {
      toast.error(s.saveErr);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // 🔄 Clear Cache
  // ============================================

  const handleClearCache = async () => {
    if (!confirm(s.confirmClearCache)) return;
    try {
      await api.post("/admin/cache/clear");
      toast.success(s.cacheClearedOk);
    } catch (err) {
      toast.error(s.cacheClearErr);
    }
  };

  // ============================================
  // 🖼️ Loading
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  // ============================================
  // 🖼️ Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{s.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">{s.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={handleClearCache}
          >
            {s.clearCache}
          </Button>
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSave}
            isLoading={isSaving}
          >
            {s.saveSettings}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Warning */}
      {settings.system.maintenanceMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-900 rounded-xl"
        >
          <AlertTriangle className="w-5 h-5 text-warning-500" />
          <div>
            <p className="font-medium text-warning-700 dark:text-warning-400">
              {s.maintenanceOn}
            </p>
            <p className="text-sm text-warning-600 dark:text-warning-500">
              {s.maintenanceOnDesc}
            </p>
          </div>
        </motion.div>
      )}

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold">{s.featureFlags}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <ToggleRow
            label={s.aiTutor}
            description={s.aiTutorDesc}
            checked={settings.features.aiTutor}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, aiTutor: v },
              })
            }
          />
          <ToggleRow
            label={s.stories}
            description={s.storiesDesc}
            checked={settings.features.stories}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, stories: v },
              })
            }
          />
          <ToggleRow
            label={s.scenarios}
            description={s.scenariosDesc}
            checked={settings.features.scenarios}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, scenarios: v },
              })
            }
          />
          <ToggleRow
            label={s.achievements}
            description={s.achievementsDesc}
            checked={settings.features.achievements}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, achievements: v },
              })
            }
          />
          <ToggleRow
            label={s.leaderboard}
            description={s.leaderboardDesc}
            checked={settings.features.leaderboard}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, leaderboard: v },
              })
            }
          />
          <ToggleRow
            label={s.mentors}
            description={s.mentorsDesc}
            checked={settings.features.mentors}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, mentors: v },
              })
            }
          />
          <ToggleRow
            label={s.spacedRepetition}
            description={s.spacedRepetitionDesc}
            checked={settings.features.spacedRepetition}
            onChange={(v) =>
              setSettings({
                ...settings,
                features: { ...settings.features, spacedRepetition: v },
              })
            }
          />
        </CardBody>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent-500" />
            <h2 className="text-lg font-bold">{s.systemSettings}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <ToggleRow
            label={s.maintenanceMode}
            description={s.maintenanceModeDesc}
            checked={settings.system.maintenanceMode}
            onChange={(v) =>
              setSettings({
                ...settings,
                system: { ...settings.system, maintenanceMode: v },
              })
            }
            danger
          />
          <ToggleRow
            label={s.allowRegistrations}
            description={s.allowRegistrationsDesc}
            checked={settings.system.allowRegistrations}
            onChange={(v) =>
              setSettings({
                ...settings,
                system: { ...settings.system, allowRegistrations: v },
              })
            }
          />
          <ToggleRow
            label={s.requireEmailVerification}
            description={s.requireEmailVerificationDesc}
            checked={settings.system.requireEmailVerification}
            onChange={(v) =>
              setSettings({
                ...settings,
                system: { ...settings.system, requireEmailVerification: v },
              })
            }
          />
          <Input
            label={s.maxUsers}
            type="number"
            value={settings.system.maxUsers}
            onChange={(e) =>
              setSettings({
                ...settings,
                system: {
                  ...settings.system,
                  maxUsers: parseInt(e.target.value) || 0,
                },
              })
            }
          />
        </CardBody>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-success-500" />
            <h2 className="text-lg font-bold">{s.emailSettings}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <Input
            label={s.fromAddress}
            type="email"
            value={settings.email.from}
            onChange={(e) =>
              setSettings({
                ...settings,
                email: { ...settings.email, from: e.target.value },
              })
            }
          />
          <Input
            label={s.smtpHost}
            value={settings.email.host}
            onChange={(e) =>
              setSettings({
                ...settings,
                email: { ...settings.email, host: e.target.value },
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={s.port}
              type="number"
              value={settings.email.port}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  email: {
                    ...settings.email,
                    port: parseInt(e.target.value) || 587,
                  },
                })
              }
            />
            <div className="flex items-end">
              <ToggleRow
                label="SSL/TLS"
                checked={settings.email.secure}
                onChange={(v) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, secure: v },
                  })
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-warning-500" />
            <h2 className="text-lg font-bold">{s.aiSettings}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {s.provider}
            </label>
            <select
              value={settings.ai.provider}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai: { ...settings.ai, provider: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local LLM</option>
            </select>
          </div>
          <Input
            label="API Key"
            type="password"
            value={settings.ai.apiKey}
            onChange={(e) =>
              setSettings({
                ...settings,
                ai: { ...settings.ai, apiKey: e.target.value },
              })
            }
          />
          <Input
            label={s.model}
            value={settings.ai.model}
            onChange={(e) =>
              setSettings({
                ...settings,
                ai: { ...settings.ai, model: e.target.value },
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={s.maxTokens}
              type="number"
              value={settings.ai.maxTokens}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai: {
                    ...settings.ai,
                    maxTokens: parseInt(e.target.value) || 1000,
                  },
                })
              }
            />
            <Input
              label={s.temperature}
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={settings.ai.temperature}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  ai: {
                    ...settings.ai,
                    temperature: parseFloat(e.target.value) || 0.7,
                  },
                })
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-danger-500" />
            <h2 className="text-lg font-bold">{s.rateLimiting}</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <Input
            label={s.generalRequests}
            type="number"
            value={settings.rateLimit.general}
            onChange={(e) =>
              setSettings({
                ...settings,
                rateLimit: {
                  ...settings.rateLimit,
                  general: parseInt(e.target.value) || 100,
                },
              })
            }
          />
          <Input
            label={s.authRequests}
            type="number"
            value={settings.rateLimit.auth}
            onChange={(e) =>
              setSettings({
                ...settings,
                rateLimit: {
                  ...settings.rateLimit,
                  auth: parseInt(e.target.value) || 5,
                },
              })
            }
          />
          <Input
            label={s.aiRequests}
            type="number"
            value={settings.rateLimit.ai}
            onChange={(e) =>
              setSettings({
                ...settings,
                rateLimit: {
                  ...settings.rateLimit,
                  ai: parseInt(e.target.value) || 20,
                },
              })
            }
          />
        </CardBody>
      </Card>
    </div>
  );
};

// ============================================
// 🔘 Toggle Row
// ============================================

const ToggleRow = ({ label, description, checked, onChange, danger }) => (
  <div
    className={cn(
      "flex items-center justify-between p-3 rounded-xl",
      danger && checked
        ? "bg-danger-50 dark:bg-danger-950"
        : "bg-neutral-50 dark:bg-neutral-800/50",
    )}
  >
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-neutral-400">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors",
        checked
          ? danger
            ? "bg-danger-500"
            : "bg-primary-500"
          : "bg-neutral-300 dark:bg-neutral-700",
      )}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
          checked ? "left-0.5" : "left-6",
        )}
      />
    </button>
  </div>
);

export default AdminSettingsPage;
