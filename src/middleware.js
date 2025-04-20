import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Define protected routes and their required roles
  const protectedRoutes = {
    '/admin': ['admin'],
    '/organizer': ['organizer', 'admin'],
    '/dashboard': ['user', 'organizer', 'admin'],
  }

  // Check if the current path is protected
  const matchedRoute = Object.keys(protectedRoutes).find(route => 
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    // If user is not logged in, redirect to login
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Check if user has the required role
    const requiredRoles = protectedRoutes[matchedRoute]
    if (!requiredRoles.includes(token.role)) {
      // Redirect to unauthorized page or home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    '/admin/:path*',
    '/organizer/:path*',
    '/dashboard/:path*',
  ],
} 