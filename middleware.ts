import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { parseUserVerifyInput } from '@/utils/userVerifyKey'

// Minimal in-memory rate limiter (fixed window)
const rlStore = new Map<string, { count: number; resetAt: number }>()
const takeToken = (key: string, limit: number, windowMs: number) => {
  const now = Date.now()
  const cur = rlStore.get(key)
  if (!cur || now > cur.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (cur.count >= limit) {
    return { limited: true, remaining: 0, resetAt: cur.resetAt }
  }
  cur.count += 1
  rlStore.set(key, cur)
  return { limited: false, remaining: limit - cur.count, resetAt: cur.resetAt }
}
const getClientIp = (req: Request) => {
  const xf = req.headers.get('x-forwarded-for') || ''
  const ip = xf.split(',')[0]?.trim()
  return ip || (req as any).ip || 'unknown'
}

export async function middleware(req: Request & { nextUrl: URL }) {
  const url = req.nextUrl
  const pathname = url.pathname

  // Apply lightweight rate limit
  const ip = getClientIp(req)
  // 1) Limit login attempts (only on actual login callback)
  if (pathname === '/api/auth/callback/credentials' && (req as any).method === 'POST') {
    const { limited, resetAt, remaining } = takeToken(`login:${ip}`, 5, 5 * 60_000)
    if (limited) {
      return new NextResponse(JSON.stringify({ error: 'Too many login attempts. Try again later.' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          'x-ratelimit-remaining': String(remaining),
        },
      })
    }
  }
  // 2) Limit verify page traffic (GET /verify*)
  if (pathname.startsWith('/verify') && (req as any).method === 'GET') {
    const { limited, resetAt, remaining } = takeToken(`verify:${ip}`, 60, 60_000)
    if (limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'retry-after': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          'x-ratelimit-remaining': String(remaining),
        },
      })
    }
  }

  // Allow static and image assets early (safety even with matcher)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow API routes early
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Server-side resolver for verify/result/[id]
  const verifyResultMatch = pathname.match(/^\/verify\/result\/([^\/]+)$/)
  if (verifyResultMatch) {
    const rawId = verifyResultMatch[1]
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(rawId)) {
      const parsed = parseUserVerifyInput(rawId)
      if (parsed) {
        const { baseKey, index } = parsed
        // If only base key provided, redirect to list page with q
        if (!index) {
          const redirectUrl = new URL(`/verify/result?q=${encodeURIComponent(baseKey)}`, url)
          return NextResponse.redirect(redirectUrl)
        }
        // If key+index provided, resolve detail via API and redirect to UUID if available
        try {
          const apiUrl = new URL(`/api/verify?q=${encodeURIComponent(baseKey + String(index))}`, url)
          const res = await fetch(apiUrl.toString(), { headers: { accept: 'application/json' } })
          if (res.ok) {
            const data = await res.json().catch(() => null as any)
            if (data && data.status === 'detail' && data.certificate?.id) {
              const redirectUrl = new URL(`/verify/result/${data.certificate.id}`, url)
              return NextResponse.redirect(redirectUrl)
            }
          }
          // Fallback: go to list with baseKey so client can disambiguate
          const fallbackUrl = new URL(`/verify/result?q=${encodeURIComponent(baseKey)}`, url)
          return NextResponse.redirect(fallbackUrl)
        } catch {
          const fallbackUrl = new URL(`/verify/result?q=${encodeURIComponent(baseKey)}`, url)
          return NextResponse.redirect(fallbackUrl)
        }
      }
    }
  }

  const token = await getToken({ req: req as any })
  const role = (token as any)?.role as string | undefined

  const isAdmin = role === 'admin'
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminLogin = pathname === '/admin/login'

  // 1) Protect /admin* for admins only
  if (isAdminRoute) {
    if (isAdminLogin) {
      // If already admin, go to /admin dashboard
      if (isAdmin) {
        const redirectUrl = new URL('/admin', url)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }

    // Other admin routes require admin role
    if (!isAdmin) {
      const redirectUrl = new URL('/admin/login', url)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  // 2) If admin is logged in, prevent access to non-admin pages
  if (isAdmin) {
    const redirectUrl = new URL('/admin', url)
    return NextResponse.redirect(redirectUrl)
  }

  // 3) Redirect logged-in non-admin users away from generic /login to their dashboards
  if (pathname === '/login' && role) {
    const target = role === 'institution' ? '/institution' : role === 'acreditor' ? '/acreditor' : '/'
    const redirectUrl = new URL(target, url)
    return NextResponse.redirect(redirectUrl)
  }

  // 4) Protect institution and acreditor routes by role
  const isInstitutionRoute = pathname.startsWith('/institution')
  const isAcreditorRoute = pathname.startsWith('/acreditor')

  if (isInstitutionRoute) {
    if (role !== 'institution') {
      const redirectUrl = new URL('/login', url)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  if (isAcreditorRoute) {
    if (role !== 'acreditor') {
      const redirectUrl = new URL('/login', url)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Exclude API and static assets; cover all other routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|images|fonts).*)',
    // Include login API for rate limit
    '/api/auth/:path*'
  ]
}
