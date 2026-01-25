/**
 * Error tracking utility
 *
 * This module provides a unified interface for error tracking.
 * It works with or without Sentry installed.
 *
 * To enable Sentry:
 * 1. Run: npx @sentry/wizard@latest -i nextjs
 * 2. Add NEXT_PUBLIC_SENTRY_DSN to your .env.local
 * 3. The captureException and captureMessage functions will automatically use Sentry
 */

type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

// Sentry-like interface for type safety
interface SentryLike {
  captureException: (error: unknown) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
  addBreadcrumb: (breadcrumb: {
    message?: string;
    category?: string;
    data?: Record<string, unknown>;
    level?: string;
  }) => void;
  withScope: (callback: (scope: {
    setTag: (key: string, value: string) => void;
    setExtra: (key: string, value: unknown) => void;
    setUser: (user: { id?: string; email?: string; username?: string } | null) => void;
    setLevel: (level: string) => void;
  }) => void) => void;
}

// Check if Sentry is available (will be after running the wizard)
function getSentry(): SentryLike | null {
  try {
    // Dynamic import to avoid errors if Sentry isn't installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentry = require("@sentry/nextjs");
    return sentry as SentryLike;
  } catch {
    return null;
  }
}

/**
 * Capture an exception and send it to the error tracking service
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): void {
  const Sentry = getSentry();

  // Always log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error]", error);
    if (context) {
      console.error("[Context]", context);
    }
  }

  if (Sentry) {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (context?.user) {
        scope.setUser(context.user);
      }
      Sentry.captureException(error);
    });
  } else {
    // Fallback: log to console in production if Sentry isn't configured
    console.error("[Untracked Error]", error, context);
  }
}

/**
 * Capture a message and send it to the error tracking service
 */
export function captureMessage(
  message: string,
  severity: ErrorSeverity = "info",
  context?: ErrorContext
): void {
  const Sentry = getSentry();

  if (process.env.NODE_ENV === "development") {
    const logFn =
      severity === "error" || severity === "fatal"
        ? console.error
        : severity === "warning"
          ? console.warn
          : console.log;
    logFn(`[${severity.toUpperCase()}]`, message, context);
  }

  if (Sentry) {
    Sentry.withScope((scope) => {
      scope.setLevel(severity);
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      if (context?.user) {
        scope.setUser(context.user);
      }
      Sentry.captureMessage(message, severity);
    });
  }
}

/**
 * Set the current user for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null): void {
  const Sentry = getSentry();

  if (Sentry) {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  const Sentry = getSentry();

  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: "info",
    });
  }

  if (process.env.NODE_ENV === "development") {
    console.debug(`[Breadcrumb:${category}]`, message, data);
  }
}

/**
 * Wrap a function with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  }) as T;
}
