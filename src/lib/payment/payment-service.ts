import crypto from "crypto";

export interface PaymentResult {
  resultCd?: string;
  resultMsg?: string;
  [key: string]: unknown;
}

interface ApproveParams {
  tid: string;
  ediDate: string;
  mid: string;
  goodsAmt: number;
  charSet?: string;
  signData?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 누락: ${name}`);
  }
  return value;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export const paymentService = {
  generateInitAuthData(goodsAmt: number) {
    const mid = getEnv("PAYMENT_MID");
    const merchantKey = getEnv("PAYMENT_MERCHANT_KEY");
    const moReturnUrl = getEnv("PAYMENT_MOBILE_RETURN_URL");
    const now = new Date();
    const ediDate =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const ordNo = `${mid}${ediDate}`;

    // init용 encData 규격
    const encData = sha256(`${mid}${ediDate}${goodsAmt}${merchantKey}`);

    return {
      mid,
      ediDate,
      goodsAmt,
      ordNo,
      encData,
      moReturnUrl,
    };
  },

  async approvePayment(params: ApproveParams): Promise<PaymentResult> {
    const approveUrl = "https://api.skyclassism.com/payment.do";
    const merchantKey = getEnv("PAYMENT_MERCHANT_KEY");
    const encData = sha256(
      `${params.mid}${params.ediDate}${params.goodsAmt}${merchantKey}`,
    );

    const formData = new URLSearchParams({
      tid: params.tid,
      ediDate: params.ediDate,
      mid: params.mid,
      goodsAmt: String(params.goodsAmt),
      charSet: params.charSet ?? "UTF-8",
      encData,
      signData: params.signData!,
    });
    const response = await fetch(approveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`PG 승인 요청 실패: ${response.status} ${text}`);
    }

    return response.json();
  },
};
