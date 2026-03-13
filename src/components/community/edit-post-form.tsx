"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updatePostAction } from "@/actions/post-actions"; // 🌟 수정용 액션
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
import { ImagePlus, X, Loader2 } from "lucide-react";
import { getPresignedUrlAction } from "@/actions/upload-action";
import imageCompression from "browser-image-compression";

const MAX_IMAGES = 5;

interface EditFormProps {
  orgId: number;
  isAdmin: boolean;
  post: {
    id: number;
    title: string;
    content: string;
    type: string;
    images: { id: number; url: string }[]; // 🌟 기존 이미지 데이터
  };
}

export function EditPostForm({ orgId, isAdmin, post }: EditFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // 🌟 환경 변수 (기존 이미지 미리보기용)
  const s3Domain = process.env.NEXT_PUBLIC_S3_DOMAIN || "";
  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "";
  const getFullUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (cleanPath.startsWith(`/${s3Bucket}/`)) return `${s3Domain}${cleanPath}`;
    return `${s3Domain}/${s3Bucket}${cleanPath}`;
  };

  // 🌟 상태 관리: 기존 이미지 vs 새로 추가할 이미지 분리
  const [retainedImages, setRetainedImages] = useState<
    { id: number; url: string }[]
  >(post.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 총 이미지 개수 (기존 남은 것 + 새로 추가한 것)
  const totalImageCount = retainedImages.length + newImages.length;

  // 새 이미지 선택 처리 (WriteForm과 완전히 동일)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`[${file.name}] 사진 용량이 너무 큽니다 (최대 20MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const availableSpace = MAX_IMAGES - totalImageCount;
    const filesToProcess = validFiles.slice(0, availableSpace);

    if (validFiles.length > availableSpace) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지만 첨부할 수 있습니다.`);
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    };

    try {
      const compressedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          if (!file.type.startsWith("image/")) return file;
          const compressedBlob = await imageCompression(file, options);
          const newFileName = file.name.replace(/\.[^/.]+$/, ".webp");
          return new File([compressedBlob], newFileName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
        })
      );

      setNewImages((prev) => [...prev, ...compressedFiles]);
      setNewPreviews((prev) => [
        ...prev,
        ...compressedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } catch (error) {
      alert("이미지 처리 중 문제가 발생했습니다.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 기존 이미지 삭제
  const handleRemoveRetainedImage = (idToRemove: number) => {
    setRetainedImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  // 새 이미지 삭제
  const handleRemoveNewImage = (indexToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      // 🌟 1. 삭제하지 않고 '유지'하기로 한 기존 이미지 URL들을 FormData에 담기
      retainedImages.forEach((img) => {
        formData.append("retainedImageUrls", img.url);
      });

      // 🌟 2. 새로 추가한 이미지 S3 업로드 진행
      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        const { success, url, fields, publicUrl } = await getPresignedUrlAction(
          file.name,
          file.type,
          "community"
        );

        if (success && url && fields && publicUrl) {
          const s3FormData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            s3FormData.append(key, value as string);
          });
          s3FormData.append("file", file);

          const uploadResponse = await fetch(url, {
            method: "POST",
            body: s3FormData,
          });

          if (uploadResponse.ok) {
            uploadedUrls.push(fields.key);
          } else {
            throw new Error(`[${file.name}] 업로드 실패`);
          }
        }
      }

      // S3에 무사히 올라간 새 이미지 URL들도 FormData에 담기
      uploadedUrls.forEach((key) => {
        formData.append("newImageUrls", `/${key}`);
      });

      // 🌟 3. 최종 수정 요청!
      const result = await updatePostAction(post.id, orgId, formData);

      if (result && result.success) {
        router.push(`/m/org/${orgId}/community/${post.id}`);
        router.refresh();
      } else {
        alert(result?.error || "수정에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="w-[140px]">
        <Select name="type" defaultValue={post.type}>
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
        defaultValue={post.title}
        placeholder="제목을 입력하세요"
        required
        className="text-lg py-6"
      />

      <Textarea
        name="content"
        defaultValue={post.content}
        placeholder="내용을 입력하세요. 서로를 배려하는 고운 말을 사용해주세요."
        required
        className="min-h-[300px] resize-none text-base leading-relaxed p-4"
      />

      <div className="space-y-4 pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            사진 첨부 ({totalImageCount}/{MAX_IMAGES})
          </span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/jpeg, image/png, image/webp, image/gif"
          multiple
          className="hidden"
        />

        {totalImageCount < MAX_IMAGES && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-50 border-dashed border-2 text-slate-500 hover:bg-slate-100"
          >
            <ImagePlus className="w-4 h-4" /> PC/폰에서 사진 추가
          </Button>
        )}

        {/* 🌟 렌더링: 기존 이미지 + 새 이미지 미리보기 통합 */}
        {(retainedImages.length > 0 || newPreviews.length > 0) && (
          <div className="flex flex-wrap gap-3 mt-4">
            {/* 1. 기존 이미지 렌더링 */}
            {retainedImages.map((img) => (
              <div
                key={`old-${img.id}`}
                className="relative inline-block group"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={getFullUrl(img.url)}
                    alt="기존 첨부 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRetainedImage(img.id)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* 2. 새로 추가한 이미지 렌더링 */}
            {newPreviews.map((preview, idx) => (
              <div key={`new-${idx}`} className="relative inline-block group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden border border-brand-main/50 bg-slate-100">
                  <img
                    src={preview}
                    alt={`새 이미지 미리보기 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-sm hover:bg-red-600 transition"
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
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "수정 완료"
          )}
        </Button>
      </div>
    </form>
  );
}
