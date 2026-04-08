"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit2, Trash2 } from "lucide-react";
import {
  deleteBannerAction,
  updateBannerAction,
} from "@/actions/banner-actions";
import { SingleImageUploader } from "./_components/single-image-uploader";
// 🌟 방금 만든 단일 이미지 업로더 임포트!

interface BannerProps {
  id: number;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  startDate: Date | null;
  endDate: Date | null;
}

interface EditBannerDialogProps {
  banner: BannerProps;
  orgId: number;
}

export function EditBannerDialog({ banner, orgId }: EditBannerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 상태 관리
  const [isActive, setIsActive] = useState(banner.isActive);
  // 🌟 기존 배너의 imageUrl을 초기 상태로 세팅합니다.
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(
    banner.imageUrl,
  );

  // 날짜 포맷팅
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 🌟 방어 로직: 이미지가 다 지워진 상태로 저장되지 못하게 막습니다.
    if (!uploadedImageUrl) {
      alert("배너 이미지를 등록해주세요.");
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);

      formData.append("isActive", isActive.toString());
      formData.append("bannerId", banner.id.toString());

      // 🌟 상태에 있는 이미지 URL을 폼데이터에 심어줍니다.
      formData.append("imageUrl", uploadedImageUrl);

      const result = await updateBannerAction(formData);

      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error || "수정 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 배너를 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    try {
      const result = await deleteBannerAction(banner.id);
      if (result.success) {
        setIsOpen(false);
      } else {
        alert(result.error || "삭제 실패");
      }
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 🌟 모달이 열리고 닫힐 때, 데이터가 꼬이지 않도록 초기화해줍니다.
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (!newOpen) {
      // 닫힐 때는 원본 이미지로 되돌려놓음 (수정하다가 취소했을 경우를 대비)
      setUploadedImageUrl(banner.imageUrl);
      setIsActive(banner.isActive);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-brand-main"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>배너 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <input type="hidden" name="organizationId" value={orgId} />
          <input
            type="hidden"
            name="displayOrder"
            value={banner.displayOrder}
          />

          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">배너 활성화</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="space-y-4">
            {/* 🌟 텍스트 URL 입력창을 지우고 업로더 장착! */}
            <div className="space-y-2">
              <Label>
                배너 이미지 <span className="text-red-500">*</span>
              </Label>
              <SingleImageUploader
                imageUrl={uploadedImageUrl}
                onUploadComplete={setUploadedImageUrl}
              />
            </div>

            <div className="space-y-2">
              <Label>
                제목{" "}
                <span className="text-slate-400 text-xs font-normal">
                  (선택)
                </span>
              </Label>
              <Input
                name="title"
                defaultValue={banner.title || ""}
                placeholder="배너 제목"
              />
            </div>

            <div className="space-y-2">
              <Label>
                연결 링크{" "}
                <span className="text-slate-400 text-xs font-normal">
                  (선택)
                </span>
              </Label>
              <Input
                name="linkUrl"
                defaultValue={banner.linkUrl || ""}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작 일시</Label>
                <Input
                  type="datetime-local"
                  name="startDate"
                  defaultValue={formatDateForInput(banner.startDate)}
                />
              </div>
              <div className="space-y-2">
                <Label>종료 일시</Label>
                <Input
                  type="datetime-local"
                  name="endDate"
                  defaultValue={formatDateForInput(banner.endDate)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-between pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-brand-main text-white hover:bg-brand-main/90"
                disabled={isPending || isDeleting}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                저장하기
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
