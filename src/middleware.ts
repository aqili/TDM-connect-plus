import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/create-user";

    // Redirect authenticated users from landing page to dashboard
    if (isAuth && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/pages/dashboard", req.url));
    }

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/pages/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth && !isPublicPage) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/login");
        const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/create-user";
        
        if (isAuthPage || isPublicPage) {
          return true; // Allow access to login page and public pages
        }
        return !!token; // Require authentication for other routes
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect these routes that require authentication
    "/pages/:path*",
    "/api/users/:path*",
    "/api/vacations/:path*",
    "/api/certificates/:path*",
    "/api/team-lunches/:path*",
    // Exclude auth and public API routes
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 