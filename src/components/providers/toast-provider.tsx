"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantMap = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-300 bg-white text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50",
    iconClassName: "text-emerald-600 dark:text-emerald-300",
  },
  error: {
    icon: XCircle,
    className:
      "border-rose-300 bg-white text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-50",
    iconClassName: "text-rose-600 dark:text-rose-300",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-300 bg-white text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50",
    iconClassName: "text-amber-600 dark:text-amber-300",
  },
  info: {
    icon: Info,
    className:
      "border-border bg-card text-card-foreground",
    iconClassName: "text-primary",
  },
} satisfies Record<
  ToastVariant,
  { icon: typeof Info; className: string; iconClassName: string }
>;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      const item: ToastItem = { ...input, id };
      setToasts((current) => [...current.slice(-2), item]);
      const timer = setTimeout(() => dismiss(id), input.duration ?? 4500);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const current = timers.current;
    return () => {
      for (const timer of current.values()) clearTimeout(timer);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-20 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-[380px]"
      >
        {toasts.map((item) => {
          const variant = variantMap[item.variant ?? "info"];
          const Icon = variant.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg",
                variant.className,
              )}
              role={item.variant === "error" ? "alert" : "status"}
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", variant.iconClassName)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm opacity-80">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
