"use client";

import { useState, useRef } from "react";
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
import { Pencil, Camera, Loader2 } from "lucide-react";
import { updateMyProfileAction } from "@/actions/user-action";
import { getPresignedUrlAction } from "@/actions/upload-action";
import imageCompression from "browser-image-compression";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  member: {
    name: string | null;
    image: string | null;
    company: string | null;
    job: string | null;
    address: string | null;
  };
}

export function EditProfileDialog({ member }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 이미지 관련 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(member.image);

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    company: member.company || "",
    job: member.job || "",
    address: member.address || "",
  });

  // 이미지 선택 및 압축 핸들러
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 0.8, // 프로필은 1MB 미만으로 충분
      maxWidthOrHeight: 512, // 프로필용 적당한 해상도
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
      // 브라우저 미리보기 URL 생성
      const objectUrl = URL.createObjectURL(newFile);
      setPreviewUrl(objectUrl);
    } catch (error) {
      console.error("이미지 압축 실패:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalImageUrl = member.image;

      // 1. 새 이미지가 선택되었다면 S3(MinIO) 업로드 진행
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
            finalImageUrl = `/${fields.key}`; // DB에 저장할 경로
          } else {
            throw new Error("S3 업로드 실패");
          }
        }
      }

      // 2. 서버 액션 호출 (이미지 경로 포함)
      const result = await updateMyProfileAction({
        ...formData,
        image: finalImageUrl,
      });

      if (result.success) {
        setOpen(false);
        setImageFile(null); // 상태 초기화
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
            프로필 사진과 상세 정보를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 아바타 수정 영역 */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="w-24 h-24 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={previewUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-400 text-xl">
                  {member.name?.slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="text-xs text-slate-500 font-medium">
              사진을 클릭하여 변경
            </p>
          </div>

          <div className="grid gap-4">
            {/* 회사명 */}
            <div className="space-y-2">
              <Label htmlFor="company">회사명</Label>
              <Input
                id="company"
                placeholder="예: (주)페이즘"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            {/* 직종 */}
            <div className="space-y-2">
              <Label htmlFor="job">직종</Label>
              <Input
                id="job"
                placeholder="예: 개발팀"
                value={formData.job}
                onChange={(e) =>
                  setFormData({ ...formData, job: e.target.value })
                }
              />
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                placeholder="예: 대구광역시..."
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto bg-brand-main hover:bg-brand-main/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              "변경내용 저장"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
