import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Update the request cookies so the server sees them immediately
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )
          
          // 2. Create a new response with the updated request headers
          response = NextResponse.next({
            request,
          })
          
          // 3. Set the cookies on the final response to send to the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 🔍 DEBUG LOGS for Middleware
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Middleware logic - Path:', request.nextUrl.pathname, 'User ID:', user?.id)
  
  if (!user) {
    // Redirect to login if accessing protected routes
    const isProtectedRoute = 
      request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/client') ||
      request.nextUrl.pathname.startsWith('/provider') ||
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/find_services') ||
      request.nextUrl.pathname.startsWith('/my_bookings') ||
      request.nextUrl.pathname.startsWith('/reviews_and_ratings') ||
      request.nextUrl.pathname.startsWith('/notifications') ||
      request.nextUrl.pathname.startsWith('/settings')
      // NOTE: /onboarding is intentionally NOT protected — new providers land here
      // before their profile role has been set

    if (isProtectedRoute) {
      console.log('Missing session on protected route, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Permissive check for unconfirmed email
  if (user && !user.email_confirmed_at) {
    console.log('User logged in but email not confirmed. Allowing access as requested.')
  }

  // Get user role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  const userRole = profile?.user_type || 'customer'

  // Redirect authenticated users away from auth pages
  const authPages = ['/login', '/signup', '/forgot-password']
  if (authPages.some(p => pathname.startsWith(p))) {
    if (userRole === 'provider') {
      return NextResponse.redirect(new URL('/dashboard/service_provider', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard/client', request.url))
  }

  const pathname = request.nextUrl.pathname

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Provider routes
  if (pathname.startsWith('/provider') || pathname.startsWith('/dashboard/service_provider')) {
    if (userRole !== 'provider') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    }
  }

  // Client/Customer routes
  if (pathname.startsWith('/client') || 
      pathname.startsWith('/dashboard/client') || 
      pathname.startsWith('/find_services') ||
      pathname.startsWith('/my_bookings') ||
      pathname.startsWith('/reviews_and_ratings') ||
      pathname.startsWith('/notifications') ||
      pathname.startsWith('/settings')) {
    if (userRole !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard/service_provider', request.url))
    }
  }

  // Redirect to appropriate dashboard based on role
  if (pathname === '/dashboard' || pathname === '/') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    } else if (userRole === 'provider') {
      return NextResponse.redirect(new URL('/dashboard/service_provider', request.url))    
    } else if (userRole === 'customer') {
      return NextResponse.redirect(new URL('/dashboard/client', request.url))
    } else {
      // take uer to the landing page if no role is found
      if (pathname === '/') return response
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}