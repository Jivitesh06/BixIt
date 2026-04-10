"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircleIcon, AlertCircleIcon, XIcon } from "./Icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-sm
              ${t.type === "success" ? "bg-white border-l-4 border-l-[#22C55E] border-[#E2E8F0]"
              : t.type === "error"   ? "bg-white border-l-4 border-l-[#EF4444] border-[#E2E8F0]"
              : "bg-white border-l-4 border-l-[#3B82F6] border-[#E2E8F0]"}`}
            style={{ animation: "slideInToast 0.3s ease" }}>
            <span className={`flex-shrink-0 mt-0.5 ${t.type === "success" ? "text-[#22C55E]" : t.type === "error" ? "text-[#EF4444]" : "text-[#3B82F6]"}`}>
              {t.type === "success" ? <CheckCircleIcon size={18}/> : <AlertCircleIcon size={18}/>}
            </span>
            <p className="flex-1 text-sm font-medium text-[#0F172A]">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-[#94A3B8] hover:text-[#64748B] flex-shrink-0">
              <XIcon size={14}/>
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInToast {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.addToast;
}
