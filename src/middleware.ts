import { authMiddleware } from "@kinde-oss/kinde-auth-nextjs/server"

export const config = {
    matcher: ["/dashboard/:path*", "/auth-callback"]  // theswe are the pages we want to protect 
}

export default authMiddleware