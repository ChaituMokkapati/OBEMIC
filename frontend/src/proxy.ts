import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Get the token from cookies
  const token = request.cookies.get('accessToken')?.value;

  // The paths that require authentication
  const protectedPaths = ['/admin', '/faculty', '/management'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !token) {
    // Redirect to login if unauthenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/faculty/:path*', '/management/:path*'],
};
