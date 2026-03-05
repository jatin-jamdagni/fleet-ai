import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className = "", ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-black/30 border ${
            error ? "border-red-500/50" : "border-white/10"
          } text-white placeholder-slate-600 px-3 py-2.5 text-sm font-mono
          focus:outline-none focus:border-amber-500/50 transition-colors
          ${icon ? "pl-10" : ""} ${className}`}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
