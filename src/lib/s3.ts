import { S3Client } from "@aws-sdk/client-s3";

// 환경변수가 없으면 서버가 뻗기 전에 미리 에러를 던져주면 디버깅이 편합니다.
if (
  !process.env.S3_ACCESS_KEY ||
  !process.env.S3_SECRET_KEY ||
  !process.env.S3_ENDPOINT
) {
  throw new Error("S3 환경변수가 누락되었습니다.");
}

export const s3Client = new S3Client({
  region: "ap-northeast-2", // MinIO 환경이라도 AWS SDK 규격상 더미 리전값이 필요합니다.
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // 🌟 MinIO를 쓸 때 S3와의 호환성을 맞추는 아주 중요한 핵심 옵션!
});
