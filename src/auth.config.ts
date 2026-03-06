import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // ✅ 공개 페이지(로그인 없이 접근 가능) 정의
      const isPublicPage =
        path.startsWith("/api") ||
        path.startsWith("/privacy") ||
        path.startsWith("/app/bootstrap");
      const isOnLoginPage = path.startsWith("/login");

      // 1. 공개 페이지는 로그인 여부 상관없이 무조건 통과
      if (isPublicPage) return true;

      // 2. 로그인 상태인데 로그인 페이지로 가려고 하면 메인으로 리다이렉트
      if (isOnLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // 3. 로그인 안 됐는데 보호된 구역에 가려고 하면 로그인 페이지로 (false 반환)
      if (!isLoggedIn && !isOnLoginPage) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
