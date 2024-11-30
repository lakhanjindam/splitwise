import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define auth routes that should be protected from authenticated users
  const authRoutes = ['/auth/login', '/auth/register']
  
  try {
    // Check authentication status by calling the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/user`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    const isAuthenticated = response.ok;

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthenticated && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/auth/:path*']
}
