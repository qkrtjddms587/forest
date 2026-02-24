"use client";

import { Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function BootstrapLogic() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = sp.get("code");
    if (!code) {
      router.replace("/login");
      return;
    }

    (async () => {
      const res = await signIn("credentials", { code, redirect: false });
      if (res?.ok) router.replace("/");
      else router.replace("/login");
    })();
  }, [sp, router]);

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>;
}

export default function BootstrapPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>로딩 중...</div>}>
      <BootstrapLogic />
    </Suspense>
  );
}
