import { NextResponse } from 'next/server';
 import { cookies } from 'next/headers';

 export function middleware(request) {
  const path = request.nextUrl.pathname;
  console.log(`Middleware running for path: ${path}`);

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/'];

  if (publicPaths.includes(path)) {
  console.log(`Path ${path} is public, allowing access.`);
  return NextResponse.next();
  }

  try {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');

  if (!authCookie) {
  console.log(`No auth cookie found, redirecting ${path} to /login`);
  return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = JSON.parse(authCookie.value);
  console.log(`Auth cookie found, session: ${JSON.stringify(session)}`);

  if (!session || !session.role) {
  console.log(`Invalid session found in cookie, redirecting ${path} to /login`);
  throw new Error('Invalid session');
  }

  const { role } = session;
  console.log(`User role: ${role}`);

  // Role-based routing with exact path matching
  if (path === '/admin/dashboard' && role !== 'admin' && path !== '/login') {
  console.log(`Unauthorized access to ${path} by role ${role}, redirecting to /`);
  return NextResponse.redirect(new URL('/', request.url));
  }

  if (path === '/admin/users' && role !== 'admin' && path !== '/login') {
  console.log(`Unauthorized access to ${path} by role ${role}, redirecting to /`);
  return NextResponse.redirect(new URL('/', request.url));
  }

  if (path === '/organizer/dashboard' && role !== 'organizer' && path !== '/login') {
  console.log(`Unauthorized access to ${path} by role ${role}, redirecting to /`);
  return NextResponse.redirect(new URL('/', request.url));
  }

  if (path === '/organizer/events' && role !== 'organizer' && path !== '/login') {
  console.log(`Unauthorized access to ${path} by role ${role}, redirecting to /`);
  return NextResponse.redirect(new URL('/', request.url));
  }

  console.log(`Access allowed for ${path}`);
  return NextResponse.next();

  } catch (error) {
  console.error(`Error in middleware for ${path}:`, error);
  return NextResponse.redirect(new URL('/login', request.url));
  }
 }

 export const config = {
  matcher: ['/admin/dashboard', '/admin/users', '/organizer/dashboard', '/organizer/events'],
 };