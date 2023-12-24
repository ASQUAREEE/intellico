import { type ClassValue, clsx } from "clsx"
import { Metadata } from "next"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string){     //if window!=undefined means we r on client side
  if(typeof window !== "undefined") return path
  if(process.env.VERCEL_URL) return `htps://${process.env.VERCEL_URL}${path}`
  return `https://localhost:${process.env.PORT ?? 3000}${path}`
}


export function constructMetadata({

  title = "INTELLICO",
  description = "Intellico is an open-source software to make chatting to your PDF files easy",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false                    //show up on google

}: {


title?: string
description?:string
image?:string
icons?:string
 noIndex?:boolean



} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image
        }
      ]
    },
    twitter: {
    
    card: "summary_large_image",
    title,
    description,
    images: [image],
    creator: "@AshherAli947376"

    },

    icons,
    metadataBase: new URL('https://intellico.vercel.app'),
    // themeColor: '#FFF',
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,  
      }
    })

  }
}

export const viewport = {
  // Include other properties as needed
  themeColor: '#FFF'
}