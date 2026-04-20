import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Tailwind class name merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
