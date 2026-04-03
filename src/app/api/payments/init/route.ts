import { NextRequest, NextResponse } from "next/server";
import { InitRequest } from "@/types/payment";
import { paymentService } from "@/lib/payment/payment-service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InitRequest;

    if (!body || typeof body.goodsAmt !== "number") {
      return NextResponse.json(
        { detail: "잘못된 요청입니다." },
        { status: 400 },
      );
    }

    if (body.goodsAmt <= 0) {
      return NextResponse.json(
        { detail: "결제 금액은 0원보다 커야 합니다." },
        { status: 400 },
      );
    }

    // 실무에서는 여기서 장바구니 총액과 교차검증
    const authData = paymentService.generateInitAuthData(body.goodsAmt);
    return NextResponse.json(authData, { status: 200 });
  } catch (error) {
    console.error("[POST /api/payments/init]", error);

    return NextResponse.json(
      { detail: "결제 초기화 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
