import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard)
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const isProtectedPath = path.startsWith('/dashboard') || 
                          path.startsWith('/properties') || 
                          path.startsWith('/clients') || 
                          path.startsWith('/deals');

  // Check if the user has a session (in production, this would check for a valid Zoho OAuth token)
  const hasSession = request.cookies.get('accessToken');

  // Redirect to login if accessing protected path without session
  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect to dashboard if accessing login page with active session
  if (path === '/' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
