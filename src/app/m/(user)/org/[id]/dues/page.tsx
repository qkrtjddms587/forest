"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle2,
  History,
  Receipt,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// 1. 하드코딩 데이터 (회비 정보)
// ----------------------------------------------------------------------
const DUES_DATA = {
  currentYear: 2026,
  user: {
    name: "김태우",
    position: "정회원",
  },
  // 현재 납부해야 할 정보
  payment: {
    status: "PENDING", // 'PAID' | 'PENDING'
    amount: 100000,
    dueDate: "2026-02-28",
  },
  // 지난 납부 내역 (이미 카드결제 완료된 건들)
  history: [
    {
      year: 2025,
      amount: 100000,
      date: "2025-01-15",
      method: "현대카드 (1234)",
      status: "PAID",
    },
    {
      year: 2024,
      amount: 50000,
      date: "2024-02-10",
      method: "삼성카드 (5678)",
      status: "PAID",
    },
  ],
};

// ----------------------------------------------------------------------
// 2. 메인 컴포넌트
// ----------------------------------------------------------------------
export default function DuesPage() {
  const [isProcessing, setIsProcessing] = useState(false);

  // PG 결제 요청 핸들러 (나중에 실제 PG 연동 코드 들어갈 곳)
  const requestPayment = () => {
    setIsProcessing(true);

    // 💡 실제로는 여기서 PortOne(아임포트)나 Toss Payments SDK를 호출합니다.
    setTimeout(() => {
      setIsProcessing(false);
      toast.info("PG사 결제창이 호출됩니다. (데모)");
      // 결제 성공 시 DB 업데이트 로직 필요
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b px-6 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-3 px-3 py-1 text-slate-600 border-slate-300"
          >
            {DUES_DATA.currentYear}년도 연회비
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900">회비 납부</h1>
          <p className="text-slate-500 mt-2 text-sm">
            신용/체크카드로 간편하게 납부하실 수 있습니다.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-6">
        {/* 1. 결제 카드 (메인) */}
        <Card className="shadow-xl border-0 ring-1 ring-slate-200 overflow-hidden">
          {/* 상단: 금액 표시 */}
          <div className="bg-slate-900 text-white p-8 text-center relative">
            <div className="absolute top-4 right-4 opacity-20">
              <CreditCard className="w-24 h-24 -rotate-12" />
            </div>
            <p className="text-slate-300 text-sm mb-1">납부하실 금액</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {DUES_DATA.payment.amount.toLocaleString()}원
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs text-slate-300">
              <span>납부기한: {DUES_DATA.payment.dueDate}</span>
            </div>
          </div>

          <CardContent className="pt-8 px-6 md:px-8">
            {/* 납부 상태에 따른 UI 분기 */}
            {DUES_DATA.payment.status === "PAID" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  납부가 완료되었습니다.
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  2026-02-10 14:30 승인완료
                </p>
                <Button variant="outline" className="mt-6 w-full">
                  <Receipt className="w-4 h-4 mr-2" /> 매출전표(영수증) 보기
                </Button>
              </div>
            ) : (
              // 미납 상태 (결제 버튼 표시)
              <div className="space-y-6">
                {/* 결제 정보 요약 */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">청구명</span>
                    <span className="font-bold text-slate-900">
                      {DUES_DATA.currentYear}년 정기 회비
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">회원명</span>
                    <span className="font-medium text-slate-900">
                      {DUES_DATA.user.name} ({DUES_DATA.user.position})
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">결제 수단</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> 신용/체크카드
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                  <p>
                    결제 버튼을 누르면 PG사(결제 대행사) 인증 화면으로
                    이동합니다. 법인카드 및 개인카드 모두 사용 가능합니다.
                  </p>
                </div>

                {/* 결제 버튼 */}
                <Button
                  className="w-full h-14 text-lg bg-brand-main hover:bg-brand-main/80 shadow-lg shadow-blue-200"
                  onClick={requestPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      결제창 호출 중...
                    </>
                  ) : (
                    "카드 결제하기"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. 지난 납부 내역 (영수증) */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-slate-500" />
            지난 납부 내역
          </h2>

          <div className="space-y-3">
            {DUES_DATA.history.map((record, idx) => (
              <Card
                key={idx}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {record.year}년도 회비
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {record.date} · {record.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {record.amount.toLocaleString()}원
                    </p>
                    <button className="text-xs text-blue-600 hover:underline mt-1 font-medium">
                      영수증
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 푸터 메시지 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            문제가 발생할 경우 사무국(053-1234-5678)으로 문의 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
