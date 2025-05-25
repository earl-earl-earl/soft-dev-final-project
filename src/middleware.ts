// middleware.ts (ensure this is the exact version you are using)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}`);

  // Create a Supabase client configured to use cookies
  // THE RESPONSE OBJECT IS PASSED AND MODIFIED BY THE COOKIE HANDLER
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(`[Middleware] Cookie SET: ${name}`); // Optional log
          request.cookies.set({ name, value, ...options }); // Update for current request processing
          response.cookies.set({ name, value, ...options }); // Set on outgoing response
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`[Middleware] Cookie REMOVE: ${name}`); // Optional log
          request.cookies.set({ name, value: '', ...options }); // Update for current request processing
          response.cookies.set({ name, value: '', ...options }); // Set on outgoing response
        },
      },
    }
  );

  // Refresh session if expired - this will update cookies via the .set method above if needed
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[Middleware] Error supabase.auth.getUser():", error.message);
  } else if (user) {
    // console.log("[Middleware] User session active for:", user.id);
  } else {
    console.log("[Middleware] No active user session found by middleware.");
  }
  
  return response; // Return the response that may have updated cookies
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|assets/|logo.svg|api/auth/).*)',
  ],
};