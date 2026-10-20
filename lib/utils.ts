import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose conditional Tailwind classes without conflicting utility declarations. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
