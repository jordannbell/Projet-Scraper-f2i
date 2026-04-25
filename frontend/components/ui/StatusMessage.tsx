"use client";

interface StatusMessageProps {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
}

export default function StatusMessage({ type, children, className = "" }: StatusMessageProps) {
  const typeClass =
    type === "success"
      ? "status-success"
      : type === "error"
        ? "status-error"
        : "bg-blue-500/10 border border-blue-400/30 text-blue-200";

  return <div className={`rounded-xl px-3 py-2 text-sm ${typeClass} ${className}`}>{children}</div>;
}
