import { paymentService } from "@/lib/payment/payment-service";
import { NextRequest, NextResponse } from "next/server";

interface ConfirmRequest {
  tid: string;
  ediDate: string;
  mid: string;
  goodsAmt: number;
  charSet?: string;
  signData?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConfirmRequest;

    if (!body.tid || !body.ediDate || !body.mid || !body.goodsAmt) {
      return NextResponse.json(
        { detail: "필수 파라미터가 누락되었습니다." },
        { status: 400 },
      );
    }

    const result = await paymentService.approvePayment({
      tid: body.tid,
      ediDate: body.ediDate,
      mid: body.mid,
      goodsAmt: body.goodsAmt,
      charSet: body.charSet ?? "UTF-8",
      signData: body.signData,
    });
    console.log(result);
    if (result.resultCd === "0000") {
      return NextResponse.json(
        {
          status: "success",
          message: "결제 승인 완료",
          data: result,
        },
        { status: 200 },
      );
    }

    const errorMsg =
      typeof result.resultMsg === "string"
        ? result.resultMsg
        : "PG사 결제 거절";
    const errorCode =
      typeof result.resultCd === "string" ? result.resultCd : "UNKNOWN";

    return NextResponse.json(
      {
        detail: `결제 실패 [${errorCode}]: ${errorMsg}`,
        data: result,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[POST /api/payments/confirm]", error);

    return NextResponse.json(
      { detail: "결제 승인 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
