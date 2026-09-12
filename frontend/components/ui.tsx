"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn, Z } from "@/lib/cn";

/**
 * shadcn-style primitives on Radix: mission Modal (drawer on mobile),
 * Toast system, restrained section headings (eyebrow max 1 per 3 sections).
 */

// ---------- Modal ----------
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-primary/30 backdrop-blur-[2px]"
            style={{ zIndex: Z.overlay }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "fixed left-1/2 top-1/2 max-h-[88dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel bg-surface-elevated shadow-lift",
              "max-md:left-0 max-md:top-auto max-md:bottom-0 max-md:w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none",
              wide ? "max-w-2xl" : "max-w-lg",
            )}
            style={{ zIndex: Z.overlay + 1 }}
            role="dialog"
            aria-label={title}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Dialog.Title className="font-display text-lg">{title}</Dialog.Title>
              <Dialog.Close asChild>
                <button aria-label="Close dialog" className="rounded-control p-2 hover:bg-surface-overlay pressable">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------- Toast ----------
interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: "xp" | "coin" | "bad";
}

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => undefined);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduce = useReducedMotion();

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s.slice(-2), { ...t, id }]);
    window.setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4200);
  }, []);

  const toneBar = { xp: "bg-xp", coin: "bg-coin", bad: "bg-danger" } as const;

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:bottom-8" style={{ zIndex: Z.toast }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto overflow-hidden rounded-card bg-surface-elevated shadow-lift"
            >
              <div className={cn("h-1", toneBar[t.tone])} />
              <div className="px-4 py-3">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="text-sm text-ink-secondary">{t.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Section heading (eyebrow restraint: use sparingly) ----------
export function SectionHeading({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>
        )}
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------- Field (label above, error below) ----------
export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "w-full rounded-control border border-line bg-surface-card px-3 py-2 text-ink-primary placeholder:text-ink-muted focus:border-xp";
