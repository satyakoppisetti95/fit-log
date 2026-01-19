import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    // You can add additional middleware logic here if needed
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        // Note: /api/auth/* is handled by NextAuth automatically
        const publicRoutes = ['/login', '/api/auth/init-demo', '/api/auth/register']
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
        
        // API routes that require auth are handled by NextAuth
        // /api/user/* requires authentication (handled by token check below)
        
        // Allow public routes
        if (isPublicRoute) {
          return true
        }
        
        // Require token for protected routes
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
