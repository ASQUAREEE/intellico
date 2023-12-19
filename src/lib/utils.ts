import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string){     //if window!=undefined means we r on client side
  if(typeof window !== "undefined") return path
  if(process.env.VERCEL_URL) return `htps://${process.env.VERCEL_URL}${path}`
  return `https://localhost:${process.env.PORT ?? 3000}${path}`
}