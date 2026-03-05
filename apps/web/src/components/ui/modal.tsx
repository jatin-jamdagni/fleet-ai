import { ReactNode } from "react";

export function Modal({
  title,
  open,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} bg-slate-900 border border-white/10 shadow-2xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="font-black tracking-tight text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
