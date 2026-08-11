import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Unisce classi Tailwind risolvendo i conflitti a favore dell'ultima. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
