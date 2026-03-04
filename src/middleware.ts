import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// ❌ 기존: import { auth } from "@/auth" (이게 에러 원인)
// ✅ 변경: 가벼운 설정으로 초기화
export default NextAuth(authConfig).auth;

export const config = {
  // api, static 파일 등은 미들웨어 제외
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|privacy).*)"],
};
