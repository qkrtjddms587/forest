"use client";

import { useEffect } from "react";

import { Loader2, ShieldAlert } from "lucide-react";
import { logoutAction } from "@/actions/auth-action";

export function AutoLogout() {
  useEffect(() => {
    logoutAction();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
      <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">
        접근 권한이 없습니다
      </h1>
      <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        안전하게 로그아웃 처리 중입니다...
      </p>
    </div>
  );
}
