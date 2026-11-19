"use client";

import { toast } from "sonner";

function detail(value: string) {
  const line = value.replace(/\s+/g, " ").trim();
  if (line.length <= 120) {
    return line;
  }
  return `${line.slice(0, 119)}…`;
}

export function confirmCompleted(title: string, description?: string) {
  const text = description ? detail(description) : "";
  toast.success(title, text ? { description: text } : undefined);
}
