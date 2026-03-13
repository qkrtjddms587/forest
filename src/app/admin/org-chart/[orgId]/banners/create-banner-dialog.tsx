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

export function CreateBannerDialog({ orgId }: { orgId: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          배너 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 배너 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input type="hidden" name="organizationId" value={orgId} />

          <div className="space-y-2">
            <Label>배너 제목 (관리용)</Label>
            <Input name="title" placeholder="예: 2026년 신년 하례회 안내" />
          </div>

          <div className="space-y-2">
            <Label>이미지 URL (필수)</Label>
            <Input name="imageUrl" placeholder="https://..." required />
          </div>

          <div className="space-y-2">
            <Label>클릭 시 이동할 링크 (선택)</Label>
            <Input name="linkUrl" placeholder="https://..." />
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

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label>즉시 활성화</Label>
              <p className="text-xs text-slate-500">체크 시 바로 노출됩니다.</p>
            </div>
            <Switch name="isActive" defaultChecked />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            등록 완료
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
