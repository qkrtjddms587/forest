"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton({ text }: { text?: string }) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => router.back()} // Next.js 라우터로 뒤로가기
    >
      {text ? text : "취소"}
    </Button>
  );
}
