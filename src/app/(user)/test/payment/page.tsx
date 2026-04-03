"use client";

import { paymentClient } from "@/lib/payment/payment-client";
import { useState } from "react";

export default function PaymentPage() {
  const [goodsNm, setGoodsNm] = useState("테스트 상품");
  const [goodsAmt, setGoodsAmt] = useState(10000);
  const [ordNm, setOrdNm] = useState("");
  const [ordTel, setOrdTel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPgIframe, setShowPgIframe] = useState(false);

  const handlePayment = async () => {
    if (!goodsNm.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    if (!goodsAmt || goodsAmt <= 0) {
      alert("결제 금액을 확인해주세요.");
      return;
    }

    try {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      setSubmitting(true);

      if (!mobile) {
        setShowPgIframe(true);
      }

      await paymentClient.startCardPayment({
        goodsAmt,
        goodsNm,
        ordNm,
        ordTel,
        directPay: "N",
        directCardCode: "",
        directCardQuota: "",
        iframeTarget: "paysm_iframe",
        onSuccess: async ({ tid }) => {
          alert(`결제 성공: ${tid}`);
          setShowPgIframe(false);
          setSubmitting(false);
        },
        onFail: (message) => {
          alert(message);
          setShowPgIframe(false);
          setSubmitting(false);
        },
      });
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "결제 처리 중 오류가 발생했습니다.",
      );
      setShowPgIframe(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">결제 페이지</h1>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              상품명
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm"
              value={goodsNm}
              onChange={(e) => setGoodsNm(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              결제 금액
            </label>
            <input
              type="number"
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm"
              value={goodsAmt}
              onChange={(e) => setGoodsAmt(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              주문자명
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm"
              value={ordNm}
              onChange={(e) => setOrdNm(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              주문자 연락처
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm"
              value={ordTel}
              onChange={(e) => setOrdTel(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={submitting}
            className="mt-2 h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "처리 중..." : "카드 결제하기"}
          </button>
        </div>
      </div>

      {showPgIframe && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <strong className="text-sm font-semibold text-slate-900">
                결제 진행 중
              </strong>
              <button
                type="button"
                className="text-sm text-slate-600"
                onClick={() => {
                  setShowPgIframe(false);
                  setSubmitting(false);
                }}
              >
                닫기
              </button>
            </div>

            <iframe
              name="paysm_iframe"
              title="PG Payment"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
