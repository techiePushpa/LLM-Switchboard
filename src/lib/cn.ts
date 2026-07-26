import { clsx, type ClassValue } from "clsx";

/** Joins conditional class names -- thin wrapper so we can extend later (e.g. tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
