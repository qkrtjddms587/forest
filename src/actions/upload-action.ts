"use server";

import { s3Client } from "@/lib/s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"; // 🌟 변경됨

export async function getPresignedUrlAction(
  fileName: string,
  contentType: string,
  prefix: string = "community"
) {
  try {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "");
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
    const uniqueFileName = `${cleanPrefix}/${Date.now()}-${safeFileName}`;

    // 🌟 S3에 정책(Policy)을 포함한 POST 방식의 티켓 발급
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
      Key: uniqueFileName,
      Conditions: [
        ["content-length-range", 0, 5 * 1024 * 1024], // 🌟 핵심: 0바이트부터 최대 5MB까지만 허용!
        ["starts-with", "$Content-Type", "image/"], // 🌟 덤: 이미지만 올릴 수 있게 제한!
      ],
      Fields: {
        "Content-Type": contentType,
      },
      Expires: 60, // 60초 유효
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}/${uniqueFileName}`;

    // url과 함께 암호화된 정책이 담긴 fields 객체를 같이 넘겨줍니다.
    return { success: true, url, fields, publicUrl };
  } catch (error) {
    console.error("[PRESIGNED_URL_ERROR]", error);
    return { success: false, error: "업로드 URL 발급에 실패했습니다." };
  }
}
