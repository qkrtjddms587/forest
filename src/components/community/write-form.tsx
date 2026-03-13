"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/actions/post-actions"; // 🌟 방금 만든 Presigned URL 액션
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/common/back-button";
import { ImagePlus, X, Loader2 } from "lucide-react"; // 아이콘 변경됨
import { getPresignedUrlAction } from "@/actions/upload-action";
import imageCompression from "browser-image-compression";

const MAX_IMAGES = 5;

interface WriteFormProps {
  orgId: number;
  isAdmin: boolean;
}

export function WriteForm({ orgId, isAdmin }: WriteFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // 🌟 파일 객체(진짜 이미지)와 미리보기 URL을 담을 상태
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 창에서 이미지를 골랐을 때 실행되는 함수
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 🌟 1차 방어선: 압축 전 원본 파일 크기 제한 (브라우저 뻗음 방지)
    // 최신 스마트폰 사진 용량을 고려해 20MB까지만 압축기에 넣도록 허용합니다.
    const MAX_INITIAL_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const validFiles = files.filter((file) => {
      if (file.size > MAX_INITIAL_FILE_SIZE) {
        alert(`[${file.name}] 사진 용량이 너무 큽니다 (최대 20MB).`);
        return false; // 탈락
      }
      return true; // 합격
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. 첨부 가능한 남은 장수 계산
    const availableSpace = MAX_IMAGES - images.length;
    const filesToProcess = validFiles.slice(0, availableSpace);

    if (validFiles.length > availableSpace) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지만 첨부할 수 있습니다.`);
    }

    // 🌟 3. 이미지 압축 옵션 설정 (최종 결과물은 1MB 이하로 보장)
    const options = {
      maxSizeMB: 1, // 최대 1MB로 압축 -> S3의 5MB 정책 무사 통과!
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    };

    try {
      // 4. 병렬 압축 실행
      const compressedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          if (!file.type.startsWith("image/")) return file;

          const compressedBlob = await imageCompression(file, options);

          // 🌟 1. 파일 이름의 끝(확장자)을 떼어내고 무조건 .webp로 바꿉니다.
          // 예: "my_photo.jpg" -> "my_photo.webp"
          const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");

          // 🌟 2. 바뀐 이름(newFileName)과 타입으로 껍데기를 다시 씌워줍니다.
          return new File([compressedBlob], newFileName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
        })
      );

      // 5. 압축된 파일로 상태 업데이트
      setImages((prev) => [...prev, ...compressedFiles]);
      setPreviews((prev) => [
        ...prev,
        ...compressedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } catch (error) {
      console.error("이미지 압축 중 에러 발생:", error);
      alert("이미지 처리 중 문제가 발생했습니다.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 첨부된 이미지 삭제 함수
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const uploadedUrls: string[] = [];

      // 🌟 1. 브라우저 -> S3(MinIO) 다이렉트 업로드 진행
      for (const file of images) {
        // 1-1. 서버에 업로드 티켓 요청 (이제 url과 fields를 받음)
        const { success, url, fields, publicUrl } = await getPresignedUrlAction(
          file.name,
          file.type,
          "community"
        );

        if (success && url && fields && publicUrl) {
          // 🌟 1-2. POST 요청을 위한 FormData 조립
          const s3FormData = new FormData();

          // 서버가 준 보안 서명 필드들을 먼저 다 집어넣습니다.
          Object.entries(fields).forEach(([key, value]) => {
            s3FormData.append(key, value as string);
          });

          // 🚨 매우 중요: 실제 파일 객체는 반드시 FormData의 "맨 마지막"에 들어가야 S3가 인식합니다!
          s3FormData.append("file", file);

          // 1-3. MinIO로 POST 전송
          const uploadResponse = await fetch(url, {
            method: "POST",
            body: s3FormData,
          });

          if (uploadResponse.ok) {
            uploadedUrls.push(fields.key);
          } else {
            throw new Error(`[${file.name}] 용량 초과 또는 업로드 실패`);
          }
        }
      }

      // 🌟 2. 완성된 폼 데이터 조립 및 DB 저장 요청

      // S3에 무사히 올라간 이미지 URL들만 formData에 담아서 넘김
      uploadedUrls.forEach((key) => {
        formData.append("imageUrls", `/${key}`);
      });

      const result = await createPostAction(formData, orgId);

      // 성공 시 커뮤니티 목록으로 이동하고 새로고침
      if (result && result.success) {
        router.push(`/m/org/${orgId}/community`);
        router.refresh();
      } else {
        alert(result?.error || "게시글 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("이미지 업로드 또는 게시글 등록 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="w-[140px]">
        <Select name="type" defaultValue="FREE">
          <SelectTrigger>
            <SelectValue placeholder="분류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">자유게시판</SelectItem>
            {isAdmin && <SelectItem value="GALLERY">갤러리</SelectItem>}
            {isAdmin && <SelectItem value="ADS">우리 기수 홍보</SelectItem>}
            {isAdmin && <SelectItem value="NOTICE">공지사항</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <Input
        name="title"
        placeholder="제목을 입력하세요"
        required
        className="text-lg py-6"
      />

      <Textarea
        name="content"
        placeholder="내용을 입력하세요. 서로를 배려하는 고운 말을 사용해주세요."
        required
        className="min-h-[300px] resize-none text-base leading-relaxed p-4"
      />

      <div className="space-y-4 pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            사진 첨부 ({images.length}/{MAX_IMAGES})
          </span>
        </div>

        {/* 🌟 진짜 파일 업로더 숨겨두기 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/jpeg, image/png, image/webp, image/gif"
          multiple
          className="hidden"
        />

        {/* 버튼을 누르면 숨겨진 input이 클릭되도록 연결 */}
        {images.length < MAX_IMAGES && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-50 border-dashed border-2 text-slate-500 hover:bg-slate-100"
          >
            <ImagePlus className="w-4 h-4" /> PC/폰에서 사진 선택
          </Button>
        )}

        {/* 🌟 선택된 이미지 미리보기 목록 */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {previews.map((preview, idx) => (
              <div key={idx} className="relative inline-block group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img
                    src={preview}
                    alt={`미리보기 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition"
                  aria-label="이미지 삭제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t mt-8">
        <BackButton />
        <Button
          type="submit"
          disabled={isPending}
          className="bg-brand-main hover:bg-brand-main/90 w-24"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록"}
        </Button>
      </div>
    </form>
  );
}
