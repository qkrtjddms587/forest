"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Edit2,
  Save,
  X,
  Phone,
  Building,
  Briefcase,
  UserCog,
  Key, // 🌟 Key 아이콘 추가
} from "lucide-react";
import { toast } from "sonner";
import { updateMemberAction } from "@/actions/admin-action";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

export function MemberDetailSheet({
  member,
  children,
}: {
  member: any;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🌟 아까 발생했던 에러 방지용 방어막!
  if (!member) return null;

  const { affiliations } = member;
  const affiliation = affiliations[0];
  const { organization, generation } = affiliation;

  // 수정용 로컬 상태 (연락처 제외, 비밀번호 추가)
  const [editForm, setEditForm] = useState({
    name: member.name,
    company: member.company || "",
    job: member.job || "",
    newPassword: "", // 🌟 새 비밀번호 상태 추가
  });

  const handleSave = async () => {
    // 🌟 서버 액션으로 전송
    const result = await updateMemberAction(member.id, editForm);
    if (result.success) {
      toast.success("정보가 성공적으로 수정되었습니다.");
      setIsEditing(false); // 수정 모드 종료
      setEditForm((prev) => ({ ...prev, newPassword: "" })); // 🌟 저장 완료 후 비밀번호 입력창 초기화
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setIsEditing(false); // Sheet 닫을 때 편집 모드 초기화
          setEditForm((prev) => ({ ...prev, newPassword: "" })); // 비밀번호 입력창도 초기화
        }
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md p-0 border-l shadow-2xl">
        <div className="p-6 space-y-6">
          <SheetHeader className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="w-24 h-24 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={member.image || ""} />
                <AvatarFallback className="text-2xl bg-slate-200">
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <SheetTitle className="text-2xl font-bold">
                  {member.name}
                </SheetTitle>
                <SheetDescription className="text-md font-medium text-brand-main mt-1">
                  {organization.name} {generation.name}
                </SheetDescription>
                <div className="mt-2">
                  {affiliation.status === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="text-orange-500 border-orange-200"
                    >
                      승인 대기중
                    </Badge>
                  )}
                  {affiliation.status === "ACTIVE" && (
                    <Badge className="bg-blue-600">활동중</Badge>
                  )}
                  {affiliation.status === "REJECTED" && (
                    <Badge variant="destructive">반려됨</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">
                Member ID: {member.id}
              </span>
              {/* 수정 아이콘 버튼 (Admin 전용) */}
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                  className="h-8 w-8 text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="w-6 h-6 text-slate-700" />
              {isEditing ? "정보 수정" : "회원 상세"}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pt-4">
            {/* 기본 정보 섹션 */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">이름</Label>
                <Input
                  disabled={!isEditing}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={
                    !isEditing ? "bg-slate-50 border-none" : "border-blue-200"
                  }
                />
              </div>

              {/* 🌟 수정 불가: 연락처 */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">
                  연락처 (수정 불가)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    disabled={true}
                    value={member.phone} // editForm 대신 원본 데이터 사용
                    className="pl-9 bg-slate-50 border-none text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 🌟 새로 추가됨: 비밀번호 변경 */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">비밀번호 변경</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    type="password"
                    disabled={!isEditing}
                    placeholder={
                      isEditing
                        ? "변경할 비밀번호 입력 (공백 시 유지)"
                        : "********"
                    }
                    value={!isEditing ? "" : editForm.newPassword}
                    className={`pl-9 ${
                      !isEditing
                        ? "bg-slate-50 border-none"
                        : "border-blue-200 placeholder:text-blue-300"
                    }`}
                    onChange={(e) =>
                      setEditForm({ ...editForm, newPassword: e.target.value })
                    }
                  />
                </div>
                {isEditing && (
                  <p className="text-[10px] text-slate-400 ml-1">
                    * 비밀번호를 변경하지 않으려면 비워두세요.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* 사회 정보 */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">회사 / 소속</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    disabled={!isEditing}
                    value={editForm.company}
                    className={`pl-9 ${
                      !isEditing ? "bg-slate-50 border-none" : "border-blue-200"
                    }`}
                    onChange={(e) =>
                      setEditForm({ ...editForm, company: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">직종</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    disabled={!isEditing}
                    value={editForm.job}
                    className={`pl-9 ${
                      !isEditing ? "bg-slate-50 border-none" : "border-blue-200"
                    }`}
                    onChange={(e) =>
                      setEditForm({ ...editForm, job: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 w-full p-4 bg-white border-t z-10">
          {isEditing ? (
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <Save className="w-4 h-4 mr-2" /> 수정 내용 저장
            </Button>
          ) : (
            <SheetClose asChild>
              <Button variant="outline" className="w-full h-12">
                닫기
              </Button>
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
