"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon, type IconId } from "@/components/illustrations";

interface ToastItem {
  id: number;
  msg: string;
  icon: IconId;
}

const ToastCtx = createContext<(msg: string, icon?: IconId) => void>(() => undefined);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((msg: string, icon: IconId = "i-check") => {
    const id = ++nextId.current;
    setItems((list) => [...list.slice(-2), { id, msg, icon }]);
    setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast" role="status">
            <Icon id={t.icon} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
