"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateMyProfileAction } from "@/actions/user-action";

interface Props {
  member: {
    company: string | null;
    job: string | null;
    address: string | null;
  };
}

export function EditProfileDialog({ member }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 초기값 설정
  const [formData, setFormData] = useState({
    company: member.company || "",
    job: member.job || "",
    address: member.address || "",
  });

  const handleSave = async () => {
    setLoading(true);
    const result = await updateMyProfileAction(formData);
    setLoading(false);

    if (result.success) {
      setOpen(false);
    } else {
      alert(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="w-4 h-4" /> 정보 수정
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>내 정보 수정</DialogTitle>
          <DialogDescription>
            변경된 정보는 모든 소속 단체의 회원 명부에 즉시 반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 회사명 */}
          <div className="space-y-2">
            <Label>회사명</Label>
            <Input
              placeholder="예: (주)미래건설"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />
          </div>

          {/* 직종 */}
          <div className="space-y-2">
            <Label>직종</Label>
            <Input
              placeholder="예: 건설업"
              value={formData.job}
              onChange={(e) =>
                setFormData({ ...formData, job: e.target.value })
              }
            />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label>주소</Label>
            <Input
              placeholder="예: 대구 수성구 달구벌대로..."
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "저장 중..." : "변경내용 저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
