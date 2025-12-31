// middleware.ts - Role-based Route Protection

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Get auth token from cookie/header
  const token = request.cookies.get('auth-token')?.value;
  const role = request.cookies.get('user-role')?.value;

  // Protected routes
  const adminRoutes = ['/dashboard-admin', '/(admin)'];
  const employeeRoutes = ['/dashboard-emp', '/(employee)'];
  const authRoutes = ['/login', '/signup', '/admin-signup', '/(auth)'];

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isEmployeeRoute = employeeRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect based on role
  if (!token) {
    if (isAdminRoute || isEmployeeRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (token) {
    if (isAuthRoute && pathname !== '/' && pathname !== '/admin-signup') {
      // Redirect logged-in users away from auth routes
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard-admin', request.url));
      } else if (role === 'employee') {
        return NextResponse.redirect(
          new URL('/dashboard-emp', request.url)
        );
      }
    }

    // Role-based access control
    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard-emp', request.url));
    }

    if (isEmployeeRoute && role !== 'employee') {
      return NextResponse.redirect(new URL('/dashboard-admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
