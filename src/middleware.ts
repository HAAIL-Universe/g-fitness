import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const publicPaths = ["/login", "/register", "/onboarding", "/api/auth/callback", "/api/invite/accept"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and API routes
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/google/callback")
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block non-admin from admin routes
  if (pathname.startsWith("/admin")) {
    const adminEmails = ["kris.deane93@gmail.com"]
    const isAdmin =
      user.app_metadata?.role === "admin" ||
      (user.email && adminEmails.includes(user.email.toLowerCase()))
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
