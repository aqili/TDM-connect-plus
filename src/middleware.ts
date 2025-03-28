import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/create-user";

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
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 