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
import { Loader2, Edit2, Trash2, ImageIcon } from "lucide-react";
import {
  deleteBannerAction,
  updateBannerAction,
} from "@/actions/banner-actions";

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
  const [imageUrl, setImageUrl] = useState<string>(banner.imageUrl);

  // 날짜 포맷팅 (서버 액션의 new Date()가 인식 가능한 포맷)
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    // UTC 시간을 로컬 datetime-local 포맷으로 변환
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);

      // 스위치 컴포넌트는 폼 데이터에 자동으로 담기지 않으므로 수동 추가
      // 서버 액션의 (isActiveValue === "true") 로직과 매칭됨
      formData.append("isActive", isActive.toString());

      // 배너 ID 및 이미지 URL 명시적 추가
      formData.append("bannerId", banner.id.toString());
      formData.append("imageUrl", imageUrl);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          {/* 🌟 서버 액션에 필요한 Hidden 필드 보강 */}
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
            {/* 이미지 URL 입력 및 실시간 미리보기 */}
            <div className="space-y-2">
              <Label>이미지 URL</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                required
              />
              <div className="mt-2 w-full h-32 rounded-md border bg-slate-50 flex items-center justify-center overflow-hidden border-dashed">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = ""; // 이미지 로드 실패 시 초기화
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">
                      올바른 이미지 URL을 입력하세요
                    </span>
                  </div>
                )}
              </div>
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
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-brand-main"
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
