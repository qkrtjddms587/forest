export interface InitRequest {
  goodsAmt: number;
}

export interface ConfirmRequest {
  tid: string;
  ediDate: string;
  mid: string;
  goodsAmt: number;
  charSet?: string;
  encData: string;
  signData: string;
}

export interface PaymentResult {
  resultCd?: string;
  resultMsg?: string;
  [key: string]: unknown;
}
