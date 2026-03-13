"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";

interface MemberProps {
  name: string;
  role?: string;
  generation: string;
  company?: string;
  job?: string;
  phone: string;
  address?: string;
  imageUrl?: string;
  position?: string;
  // 👇 추가: 현재 보고 있는 사용자의 권한 (USER, MANAGER, ADMIN 등)
  viewerRole?: string;
}

export function MemberCard({
  name,
  role,
  generation,
  company,
  job,
  phone,
  address,
  imageUrl,
  position,
  viewerRole = "USER", // 기본값은 일반 유저
}: MemberProps) {
  // ✅ 권한 체크: 매니저 이상인지 확인
  const isManagerOrHigher =
    viewerRole === "ADMIN" || viewerRole === "MANAGER" || viewerRole === "USER";

  // ✅ 전화번호 마스킹 함수 (010-1234-5678 -> 010-****-5678)
  const formatPhone = (phoneStr: string) => {
    // if (isManagerOrHigher) return phoneStr; // 관리자면 원본 표시

    // 하이픈(-)이 있든 없든 가운데 자리를 마스킹 처리
    return phoneStr.replace(/^(\d{2,3})-?(\d{3,4})-?(\d{4})$/, "$1-****-$3");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-4">
      {/* 1. 좌측 프로필 이미지 */}
      <div className="shrink-0">
        <Avatar className="w-20 h-24 rounded-lg border bg-slate-50">
          <AvatarImage
            src={`${process.env.NEXT_PUBLIC_S3_DOMAIN}/${process.env.NEXT_PUBLIC_S3_BUCKET}${imageUrl}`}
            className="object-cover"
          />
          <AvatarFallback className="rounded-lg text-slate-300 text-2xl font-bold bg-slate-100">
            {name[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 2. 중앙 및 우측 정보 영역 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* 상단 정보 */}
        <div>
          {position && (
            <p className="text-brand-main font-bold text-sm mb-0.5">
              {position}
            </p>
          )}

          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900">{name}</h3>
            <Badge className="bg-slate-900 hover:bg-slate-700 text-white text-[11px] h-5 px-1.5 rounded-sm border-0">
              {generation}
            </Badge>
          </div>

          <div className="text-sm text-slate-600 truncate leading-tight">
            {job && <span className="mr-1">{job} ·</span>}
            {company}
          </div>
          {address && (
            <p className="mt-1 text-xs text-slate-400 truncate">{address}</p>
          )}
        </div>

        {/* 하단: 연락처 및 주소 + 액션 버튼 */}
        <div className="mt-1 border-t border-dashed border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 pr-2">
            {/* 👇 마스킹된 전화번호 표시 */}
            <p className="text-sm font-medium text-slate-700">
              {formatPhone(phone)}
            </p>
          </div>

          {/* 👇 권한이 있을 때만 버튼 노출 */}
          {isManagerOrHigher && (
            <div className="flex gap-1 shrink-0">
              <a href={`tel:${phone.replace(/-/g, "")}`}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-brand-main hover:bg-blue-50 rounded-full"
                >
                  <Phone className="w-4 h-4 fill-current" />
                </Button>
              </a>
              <a href={`sms:${phone.replace(/-/g, "")}`}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-brand-main hover:bg-blue-50 rounded-full"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
