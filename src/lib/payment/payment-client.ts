export interface PaymentInitResponse {
  ediDate: string;
  encData: string;
  mid: string;
  ordNo: string;
  moReturnUrl: string;
}

export interface ConfirmPaymentPayload {
  tid: string;
  ediDate: string;
  mid: string;
  goodsAmt: string;
  charSet?: string;
  signData: string;
}

export interface StartCardPaymentParams {
  goodsAmt: number;
  goodsNm: string;
  ordNm?: string;
  ordTel?: string;
  directPay?: "Y" | "N";
  directCardCode?: string;
  directCardQuota?: string;
  iframeTarget?: string;
  onSuccess: (result: {
    tid: string;
    ediDate: string;
    mid: string;
    goodsAmt: number;
    charSet?: string;
    signData: string;
    encData: string;
  }) => Promise<void> | void;
  onFail?: (message: string) => void;
}

async function parseJsonSafe<T>(
  res: Response,
): Promise<T | Record<string, never>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await parseJsonSafe<T & { detail?: string }>(res);

  if (!res.ok) {
    const message =
      typeof (data as { detail?: string })?.detail === "string"
        ? (data as { detail?: string }).detail
        : "요청 처리 중 오류가 발생했습니다.";
    throw new Error(message);
  }

  return data as T;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function createHiddenForm(
  action: string,
  inputs: Record<string, string | number>,
  method: "POST" | "GET" = "POST",
): HTMLFormElement {
  const form = document.createElement("form");
  form.method = method;
  form.action = action;

  Object.entries(inputs).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  return form;
}

export const paymentClient = {
  async init(goodsAmt: number): Promise<PaymentInitResponse> {
    return request<PaymentInitResponse>("/api/payments/init", {
      method: "POST",
      body: JSON.stringify({ goodsAmt }),
    });
  },

  async confirm(payload: ConfirmPaymentPayload) {
    return request<{
      status: string;
      message: string;
      data: Record<string, unknown>;
    }>("/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async startCardPayment(params: StartCardPaymentParams) {
    const {
      goodsAmt,
      goodsNm,
      ordNm,
      ordTel,
      directPay = "N",
      directCardCode,
      directCardQuota,
      iframeTarget = "paysm_iframe",
      onSuccess,
      onFail,
    } = params;

    const { ediDate, encData, mid, moReturnUrl } = await this.init(goodsAmt);
    const isMobile = isMobileDevice();

    const form = createHiddenForm(
      "https://api.skyclassism.com/payInit_hash.do",
      {
        payMethod: "card",
        mid,
        goodsNm,
        ordNm: ordNm ?? "",
        ordTel: ordTel ?? "",
        goodsAmt,
        trxCd: "0",
        ediDate,
        encData,
        charSet: "UTF-8",
        ordNo: "203" + ediDate,
        returnUrl: moReturnUrl,
        directPay,
        directCardCode: directCardCode ?? "",
        directCardQuota: directCardQuota ?? "",
        directCardPointFlag: "0",
      },
    );
    if (isMobile) {
      document.body.appendChild(form);
      form.target = "_self";
      form.submit();
      return;
    }

    return new Promise<void>((resolve, reject) => {
      let isProcessing = false;

      const cleanup = () => {
        window.removeEventListener("message", messageHandler);
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
      };

      const messageHandler = async (event: MessageEvent) => {
        const receiveData =
          event.data && Array.isArray(event.data) && event.data[1]
            ? event.data[1]
            : null;
        console.log(receiveData);
        if (!receiveData) return;

        if (receiveData.resultCode === "0000") {
          if (isProcessing) return;
          isProcessing = true;

          window.removeEventListener("message", messageHandler);

          try {
            await this.confirm({
              tid: receiveData.tid,
              ediDate: receiveData.ediDate,
              mid: receiveData.mid,
              goodsAmt: String(receiveData.goodsAmt),
              signData: receiveData.signData,
            });

            await onSuccess({
              tid: receiveData.tid,
              ediDate: receiveData.ediDate,
              mid: receiveData.mid,
              goodsAmt: Number(receiveData.goodsAmt),
              signData: receiveData.signData,
              encData,
            });

            cleanup();
            resolve();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "결제 승인 처리 중 오류가 발생했습니다.";

            onFail?.(message);
            cleanup();
            reject(error);
          }
        } else {
          const message = receiveData.resultMsg || "결제에 실패했습니다.";
          onFail?.(message);
          cleanup();
          reject(new Error(message));
        }
      };

      window.addEventListener("message", messageHandler);

      setTimeout(() => {
        document.body.appendChild(form);
        form.target = iframeTarget;
        form.submit();
      }, 100);
    });
  },
};
