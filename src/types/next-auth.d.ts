import NextAuth, { DefaultSession } from "next-auth";

// NextAuth의 Session과 User 타입을 확장(Augmentation)합니다.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // 🌟 Affiliation 모델 구조에 맞게 정의
      affiliations: {
        organizationId: number;
        role: string; // "ADMIN", "MANAGER", "USER"
        status: string;
      }[];
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    affiliations?: any[];
  }
}
