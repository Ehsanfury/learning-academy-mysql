/**
 * ErrorState.jsx
 * Path: src/components/ui/ErrorState.jsx
 * Description: Error state component for failed requests and crashes
 * Version: 1.0 - New component
 * Features:
 * - ✅ Error icon, title, message
 * - ✅ Retry button
 * - ✅ Show details (collapsible)
 * - ✅ Multiple variants
 * - ✅ Report error action
 */

import { useState } from "react";
import Button from "./Button";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@utils/helpers";
import { useLanguage } from "@context/LanguageContext";

// ============================================
// 📏 Sizes
// ============================================

const sizes = {
  sm: {
    icon: "w-10 h-10",
    title: "text-base",
    description: "text-xs",
    padding: "py-6",
  },
  md: {
    icon: "w-16 h-16",
    title: "text-lg",
    description: "text-sm",
    padding: "py-10",
  },
  lg: {
    icon: "w-20 h-20",
    title: "text-xl",
    description: "text-base",
    padding: "py-16",
  },
};

// ============================================
// 🔄 ErrorState Component
// ============================================

const ErrorState = ({
  // ========== Content ==========
  title,
  message,
  error,

  // ========== Display ==========
  size = "md",
  icon: Icon = AlertTriangle,

  // ========== Actions ==========
  onRetry,
  onReport,
  retryLabel,
  reportLabel,

  // ========== Details ==========
  showDetails = false,

  // ========== Style ==========
  className = "",
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const { language } = useLanguage();
  const isFa = language === "fa";
  const config = sizes[size] || sizes.md;

  const resolvedTitle =
    title ?? (isFa ? "خطایی رخ داده است" : "An error occurred");
  const resolvedMessage =
    message ??
    (isFa
      ? "متأسفانه در بارگذاری اطلاعات خطایی رخ داده است. لطفاً دوباره تلاش کنید."
      : "Sorry, an error occurred while loading the data. Please try again.");
  const resolvedRetryLabel = retryLabel ?? (isFa ? "تلاش مجدد" : "Try Again");
  const resolvedReportLabel =
    reportLabel ?? (isFa ? "گزارش خطا" : "Report Error");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        config.padding,
        "px-4",
        className,
      )}
      role="alert"
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-4 rounded-full bg-danger-100 dark:bg-danger-950 flex items-center justify-center",
          config.icon,
        )}
      >
        <Icon
          className={cn(
            "text-danger-500",
            size === "sm" ? "w-5 h-5" : size === "lg" ? "w-10 h-10" : "w-8 h-8",
          )}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-bold text-neutral-900 dark:text-neutral-100 mb-2",
          config.title,
        )}
      >
        {resolvedTitle}
      </h3>

      {/* Message */}
      <p
        className={cn(
          "text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-6",
          config.description,
        )}
      >
        {resolvedMessage}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon={RefreshCw}
            size={size === "sm" ? "sm" : "md"}
          >
            {resolvedRetryLabel}
          </Button>
        )}

        {onReport && (
          <Button
            variant="ghost"
            onClick={onReport}
            size={size === "sm" ? "sm" : "md"}
          >
            {resolvedReportLabel}
          </Button>
        )}
      </div>

      {/* Error Details */}
      {showDetails && error && (
        <div className="mt-6 w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors mx-auto"
          >
            {showErrorDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showErrorDetails
              ? isFa
                ? "پنهان کردن جزئیات"
                : "Hide details"
              : isFa
                ? "نمایش جزئیات"
                : "Show details"}
          </button>

          {showErrorDetails && (
            <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-left overflow-auto max-h-48">
              <pre className="text-xs text-neutral-600 dark:text-neutral-400 font-mono whitespace-pre-wrap">
                {typeof error === "string"
                  ? error
                  : error?.message || JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
