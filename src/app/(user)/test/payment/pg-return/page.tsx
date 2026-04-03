"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { paymentClient } from "@/lib/payment/payment-client";

function PgReturnContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("결제 승인 처리 중입니다.");

  useEffect(() => {
    const run = async () => {
      try {
        const tid = searchParams.get("tid") ?? "";
        const ediDate = searchParams.get("ediDate") ?? "";
        const mid = searchParams.get("mid") ?? "";
        const goodsAmt = String(searchParams.get("goodsAmt") ?? 0);
        const signData = searchParams.get("signData") ?? "";

        if (!tid || !ediDate || !mid || !goodsAmt || !signData) {
          throw new Error("결제 승인에 필요한 값이 누락되었습니다.");
        }

        await paymentClient.confirm({
          tid,
          ediDate,
          mid,
          goodsAmt,
          signData,
          charSet: "UTF-8",
        });

        sessionStorage.removeItem("temp_enc_data");
        sessionStorage.removeItem("temp_ord_no");
        setMessage("결제가 완료되었습니다.");
      } catch (error) {
        console.error(error);
        setMessage(
          error instanceof Error
            ? error.message
            : "결제 승인 처리 중 오류가 발생했습니다.",
        );
      }
    };

    run();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-2xl bg-white px-8 py-10 text-base font-semibold text-slate-900 shadow-lg">
        {message}
      </div>
    </div>
  );
}

export default function PgReturnPage() {
  return (
    <Suspense fallback={<div className="p-6">로딩 중...</div>}>
      <PgReturnContent />
    </Suspense>
  );
}
