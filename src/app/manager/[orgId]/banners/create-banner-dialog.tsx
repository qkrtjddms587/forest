"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { createBannerAction } from "@/actions/banner-actions";
import { SingleImageUploader } from "./_components/single-image-uploader";
// 🌟 방금 만든 컴포넌트 임포트!

export function CreateBannerDialog({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 🌟 S3 업로드가 완료된 URL을 담을 상태
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!uploadedImageUrl) {
      alert("배너 이미지를 업로드해주세요.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("imageUrl", uploadedImageUrl); // 🌟 폼에 쓱 끼워넣기

    startTransition(async () => {
      const result = await createBannerAction(formData);
      if (result.success) {
        alert("배너가 등록되었습니다.");
        setOpen(false);
      } else {
        alert(result.error);
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setUploadedImageUrl(""); // 모달 닫을 때 잔여 이미지 청소
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-brand-main hover:bg-brand-main/80 text-white">
          <Plus className="w-4 h-4 mr-2" />
          배너 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 배너 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <input type="hidden" name="organizationId" value={orgId} />

          <div className="space-y-2">
            <Label>배너 제목 (관리용)</Label>
            <Input
              name="title"
              placeholder="예: 2026년 신년 하례회 안내"
              required
            />
          </div>

          {/* 🌟 텍스트 URL 입력 대신 S3 업로더 컴포넌트 장착! */}
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
            <Label>클릭 시 이동할 링크 (선택)</Label>
            <Input name="linkUrl" placeholder="예: https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>노출 시작일 (선택)</Label>
              <Input name="startDate" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label>노출 종료일 (선택)</Label>
              <Input name="endDate" type="datetime-local" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-slate-800">즉시 활성화</Label>
              <p className="text-xs text-slate-500">
                스위치를 켜면 앱에 바로 노출됩니다.
              </p>
            </div>
            <Switch name="isActive" defaultChecked />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base bg-brand-main hover:bg-brand-main/90"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            등록 완료
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
