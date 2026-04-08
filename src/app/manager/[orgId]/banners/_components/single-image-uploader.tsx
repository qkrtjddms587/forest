"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { getPresignedUrlAction } from "@/actions/upload-action";

interface SingleImageUploaderProps {
  imageUrl: string;
  onUploadComplete: (url: string) => void;
  folder?: string; // 🌟 폴더명 프롭스 추가 (선택)
}

export function SingleImageUploader({
  imageUrl,
  onUploadComplete,
  folder = "common", // 🌟 프롭스가 안 넘어오면 'common' 폴더로 기본 지정
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📸 이미지 선택, 압축 및 즉시 업로드
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("사진 용량이 너무 큽니다 (최대 20MB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // 1. 이미지 압축
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      };
      let compressedFile = file;

      if (file.type.startsWith("image/")) {
        const compressedBlob = await imageCompression(file, options);
        // 한글 파일명 깨짐 및 중복 방지를 위한 안전한 이름 생성
        const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
        compressedFile = new File([compressedBlob], newFileName, {
          type: "image/webp",
        });
      }

      // 2. S3 Presigned URL 요청 및 업로드
      const { success, url, fields } = await getPresignedUrlAction(
        compressedFile.name,
        compressedFile.type,
        folder, // 🌟 하드코딩된 "banners" 대신 외부에서 주입받은 folder 변수 사용!
      );

      if (success && url && fields) {
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append("file", compressedFile);

        const uploadResponse = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          // 🌟 성공 시 S3 URL을 부모(폼)에게 전달
          onUploadComplete(`/${fields.key}`);
        } else {
          throw new Error("업로드 실패");
        }
      }
    } catch (error) {
      console.error(error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 🗑️ 이미지 삭제
  const handleRemove = () => {
    onUploadComplete(""); // 부모 상태 비우기
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/jpeg, image/png, image/webp, image/gif"
        className="hidden"
      />

      {/* 이미지가 없을 때: 업로드 버튼 표시 */}
      {!imageUrl && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 flex flex-col items-center gap-2 bg-slate-50 border-dashed border-2 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-brand-main" />
              <span>업로드 중...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6" />
              <span>클릭하여 이미지 선택</span>
            </>
          )}
        </Button>
      )}

      {/* 이미지가 있을 때: 미리보기 및 삭제 버튼 표시 */}
      {imageUrl && !isUploading && (
        <div className="relative w-full rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              imageUrl.startsWith("/")
                ? `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${imageUrl}`
                : imageUrl
            }
            alt="업로드 미리보기"
            className="w-full object-contain max-h-48"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-slate-900/60 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
