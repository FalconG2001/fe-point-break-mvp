import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAdmin = !!token?.isAdmin;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/session-handle", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
      error: "/session-handle",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};
