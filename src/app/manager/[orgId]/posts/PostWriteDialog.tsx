"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ImagePlus, X, Loader2, PenSquare } from "lucide-react";
import imageCompression from "browser-image-compression";

// 🌟 서버 액션 임포트 (경로는 팀장님 환경에 맞게 확인해 주세요!)
import { getPresignedUrlAction } from "@/actions/upload-action";
import { createPostAction } from "@/actions/post-actions";

const MAX_IMAGES = 5;

export function PostWriteDialog({ orgId }: { orgId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // 이미지 상태 관리
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 닫힐 때 상태를 초기화하는 함수
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setImages([]);
      setPreviews([]);
      setIsPending(false);
    }
  };

  // 📸 이미지 선택 및 압축 로직 (유저 페이지와 100% 동일)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_INITIAL_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    const validFiles = files.filter((file) => {
      if (file.size > MAX_INITIAL_FILE_SIZE) {
        alert(`[${file.name}] 사진 용량이 너무 큽니다 (최대 20MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const availableSpace = MAX_IMAGES - images.length;
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
        }),
      );

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

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 🚀 폼 제출 및 S3 업로드 로직
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const uploadedUrls: string[] = [];

      // 1. 브라우저 -> S3 다이렉트 업로드
      for (const file of images) {
        const { success, url, fields, publicUrl } = await getPresignedUrlAction(
          file.name,
          file.type,
          "community",
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
            throw new Error(`[${file.name}] 용량 초과 또는 업로드 실패`);
          }
        }
      }

      // 2. 완성된 폼 데이터 조립
      uploadedUrls.forEach((key) => {
        formData.append("imageUrls", `/${key}`);
      });

      // 3. 서버 액션 호출 (DB 저장)
      const result = await createPostAction(formData, orgId);

      if (result && result.success) {
        // 🌟 성공 시: 모달 닫기 + 목록 새로고침
        handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-brand-main hover:bg-brand-main/90">
          <PenSquare className="w-4 h-4 mr-2" />
          글쓰기
        </Button>
      </DialogTrigger>

      {/* 화면이 작은 랩탑을 고려해 max-h와 overflow 추가 */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            관리자 게시글 작성
          </DialogTitle>
        </DialogHeader>

        {/* 🌟 유저 폼(WriteForm)과 동일한 UI */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="w-[140px]">
            <Select name="type" defaultValue="NOTICE">
              <SelectTrigger>
                <SelectValue placeholder="분류" />
              </SelectTrigger>
              <SelectContent>
                {/* 관리자 모달이므로 모든 권한(공지, 갤러리 등) 오픈 */}
                <SelectItem value="NOTICE">공지사항</SelectItem>
                <SelectItem value="GALLERY">갤러리</SelectItem>
                <SelectItem value="ADS">우리 기수 홍보</SelectItem>
                <SelectItem value="FREE">자유게시판</SelectItem>
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

          {/* 📸 사진 첨부 영역 */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">
                사진 첨부 ({images.length}/{MAX_IMAGES})
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

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative inline-block group">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🚀 하단 버튼 영역 */}
          <div className="flex gap-2 justify-end pt-4 border-t mt-8">
            {/* 유저 페이지의 BackButton 대신 모달 닫기 버튼으로 교체 */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-24"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-main hover:bg-brand-main/90 w-24"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "등록"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
