import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/conversations/:path*",
    "/whatsapp/:path*",
    "/flows/:path*",
    "/settings/:path*",
    "/attendants/:path*",
  ],
};
