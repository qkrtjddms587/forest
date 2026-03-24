"use client";

import { useState, useRef } from "react";
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
  Key,
  Camera,
  Loader2,
  MapPin, // 🌟 MapPin 아이콘 추가 (주소용)
} from "lucide-react";
import { toast } from "sonner";
import { updateMemberAction } from "@/actions/admin-action";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

import { getPresignedUrlAction } from "@/actions/upload-action";
import imageCompression from "browser-image-compression";

export function MemberDetailSheet({
  member,
  children,
}: {
  member: any;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!member) return null;

  const { affiliations } = member;
  const affiliation = affiliations[0];
  const { organization, generation } = affiliation;

  const [editForm, setEditForm] = useState({
    // 이름은 이제 상태로 관리하지 않고 member.name을 바로 씁니다.
    company: member.company || "",
    job: member.job || "",
    address: member.address || "", // 🌟 주소 상태 추가
    newPassword: "",
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 512,
      useWebWorker: true,
      fileType: "image/webp",
    };

    try {
      const compressedBlob = await imageCompression(file, options);
      const newFile = new File([compressedBlob], `profile_${Date.now()}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });

      setImageFile(newFile);
      setPreviewUrl(URL.createObjectURL(newFile));
    } catch (error) {
      console.error("이미지 압축 실패:", error);
      toast.error("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalImageUrl = member.image;

      if (imageFile) {
        const { success, url, fields } = await getPresignedUrlAction(
          imageFile.name,
          imageFile.type,
          "profiles"
        );

        if (success && url && fields) {
          const s3FormData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            s3FormData.append(key, value as string);
          });
          s3FormData.append("file", imageFile);

          const uploadResponse = await fetch(url, {
            method: "POST",
            body: s3FormData,
          });

          if (uploadResponse.ok) {
            finalImageUrl = `/${fields.key}`;
          } else {
            throw new Error("S3 업로드 실패");
          }
        }
      }

      // 서버 액션 호출 (🌟 address 필드 추가됨)
      const result = await updateMemberAction(member.id, {
        ...editForm,
        image: finalImageUrl,
      });

      if (result.success) {
        toast.success("정보가 성공적으로 수정되었습니다.");
        setIsEditing(false);
        setEditForm((prev) => ({ ...prev, newPassword: "" }));
        setImageFile(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (member.image) {
      return `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${member.image}`;
    }
    return "";
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setIsEditing(false);
          setEditForm((prev) => ({ ...prev, newPassword: "" }));
          setImageFile(null);
          setPreviewUrl(null);
        }
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md p-0 border-l shadow-2xl">
        <div className="p-6 space-y-6">
          <SheetHeader className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              {isEditing ? (
                <label className="relative group cursor-pointer w-24 h-24 rounded-full block">
                  <Avatar className="w-full h-full border-2 border-slate-100 shadow-sm">
                    <AvatarImage
                      src={displayImageUrl()}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="text-2xl bg-slate-200 w-full h-full flex items-center justify-center">
                      {member.name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6" />
                  </div>

                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              ) : (
                <Avatar className="w-24 h-24 border-2 border-slate-100 shadow-sm">
                  <AvatarImage
                    src={displayImageUrl()}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-2xl bg-slate-200 w-full h-full flex items-center justify-center">
                    {member.name[0]}
                  </AvatarFallback>
                </Avatar>
              )}

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
            <div className="grid gap-4">
              {/* 🌟 이름: 수정 불가로 변경 */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">
                  이름 (수정 불가)
                </Label>
                <Input
                  disabled={true}
                  value={member.name}
                  className="bg-slate-50 border-none text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* 연락처: 수정 불가 */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">
                  연락처 (수정 불가)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    disabled={true}
                    value={member.phone}
                    className="pl-9 bg-slate-50 border-none text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

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
              </div>
            </div>

            <Separator />

            <div className="grid gap-4">
              {/* 회사 */}
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

              {/* 직종 */}
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

              {/* 🌟 주소: 새로 추가됨 */}
              <div className="space-y-2">
                <Label className="text-slate-500 text-xs">주소</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-3 h-3 text-slate-400" />
                  <Input
                    disabled={!isEditing}
                    value={editForm.address}
                    placeholder="주소를 입력해주세요"
                    className={`pl-9 ${
                      !isEditing ? "bg-slate-50 border-none" : "border-blue-200"
                    }`}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
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
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> 수정 내용 저장
                </>
              )}
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
