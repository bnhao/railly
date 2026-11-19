"use client";
import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface AppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  variant?: "modal" | "drawer";
  allowLightDismiss?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function AppDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = "modal",
  allowLightDismiss = true,
  maxWidthClass = "max-w-lg",
  children,
}: AppDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Sync React open prop with native top-layer showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Listen to native close event (Esc key, back gesture, light dismiss, form method="dialog")
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onCloseRef.current();
    };

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  // Mandatory light-dismiss fallback for browsers without native HTMLDialogElement closedBy (Safari)
  useEffect(() => {
    if (!allowLightDismiss) return;
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e) && dialog.open) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [allowLightDismiss]);

  const closedByProp = {
    closedby: allowLightDismiss ? "any" : "closerequest",
  } as Record<string, string>;

  const dialogClass =
    variant === "drawer"
      ? `drawer-dialog w-full ${maxWidthClass} rounded-none md:rounded-l-2xl bg-[#151921] text-gray-200 border-l border-[#242a36] shadow-2xl`
      : `w-[calc(100%-2rem)] ${maxWidthClass} max-h-[90dvh] rounded-2xl bg-[#151921] text-gray-200 border border-[#242a36] shadow-2xl`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={dialogClass}
      {...closedByProp}
    >
      <div
        className={`flex flex-col ${
          variant === "drawer" ? "h-full" : "max-h-[90dvh]"
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#242a36] bg-[#10141c] flex-shrink-0">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-100 tracking-tight truncate"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={`Close ${title}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e2430] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom p-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isBusy?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isBusy = false,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      allowLightDismiss={!isBusy}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            autoFocus
            disabled={isBusy}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1e2430] text-gray-200 hover:bg-[#272f3f] border border-[#2d3546] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {isBusy ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </AppDialog>
  );
}
