import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const params = new URLSearchParams({
      resultCode: String(formData.get("resultCode") ?? ""),
      resultMsg: String(formData.get("resultMsg") ?? ""),
      tid: String(formData.get("tid") ?? ""),
      ediDate: String(formData.get("ediDate") ?? ""),
      mid: String(formData.get("mid") ?? ""),
      goodsAmt: String(formData.get("goodsAmt") ?? ""),
      signData: String(formData.get("signData") ?? ""),
    });

    const frontendBaseUrl =
      process.env.FRONTEND_PG_RETURN_URL ||
      "https://duelloshop.com/order/pg-return";

    const redirectUrl = `${frontendBaseUrl}?${params.toString()}`;

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error("[POST /api/payments/mobile-return]", error);

    return NextResponse.json(
      { detail: "모바일 결제 결과 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
