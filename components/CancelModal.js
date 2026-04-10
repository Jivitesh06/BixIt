"use client";

import { useState } from "react";
import { XIcon, AlertCircleIcon, Spinner } from "./Icons";
import { CANCEL_REASONS_CLIENT, CANCEL_REASONS_WORKER } from "@/lib/constants";

export default function CancelModal({ isOpen, onClose, onConfirm, role = "client", loading = false }) {
  const [selected, setSelected] = useState("");
  const [other, setOther]       = useState("");
  const reasons = role === "client" ? CANCEL_REASONS_CLIENT : CANCEL_REASONS_WORKER;

  function handleConfirm() {
    const reason = selected === "Other" ? (other.trim() || "Other") : selected;
    if (!reason) return;
    onConfirm(reason);
  }

  function handleClose() {
    setSelected(""); setOther(""); onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444]">
              <AlertCircleIcon size={16}/>
            </div>
            <h3 className="font-bold text-[#0F172A]">Cancel Booking</h3>
          </div>
          <button onClick={handleClose} className="text-[#94A3B8] hover:text-[#0F172A]"><XIcon size={18}/></button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-[#64748B] mb-4">Please tell us why you're cancelling:</p>

          {/* Reason chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {reasons.map(r => (
              <button key={r} onClick={() => setSelected(r)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${selected === r ? "bg-[#EF4444] text-white border-[#EF4444]" : "bg-[#F8FAFC] text-[#374151] border-[#E2E8F0] hover:border-[#EF4444]"}`}>
                {r}
              </button>
            ))}
          </div>

          {/* Other text */}
          {selected === "Other" && (
            <textarea value={other} onChange={e => setOther(e.target.value)} rows={2}
              placeholder="Please describe the reason…"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#EF4444] resize-none mb-4 transition-all" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleClose}
            className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#374151] hover:bg-[#F8FAFC] transition-colors">
            Keep Booking
          </button>
          <button onClick={handleConfirm} disabled={!selected || loading}
            className="flex-1 py-3 rounded-xl bg-[#EF4444] text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Spinner size={16}/>Cancelling…</> : "Cancel Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
