"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Calendar,
  Building2,
  Award,
  CheckCircle,
  XCircle,
  Settings2,
} from "lucide-react";

// 멤버 및 소속 정보를 포함한 타입 정의
type AffiliationWithDetails = {
  id: number;
  status: string;
  organization: { name: string };
  generation: { name: string };
  Position: { name: string } | null;
  createdAt: Date;
};

type MemberWithAffiliations = {
  id: number;
  name: string;
  phone: string | null;
  affiliations: AffiliationWithDetails[];
};

interface Props {
  member: MemberWithAffiliations;
  children: React.ReactNode;
}

export function MemberDetailSheet({ member, children }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50/50">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">
                {member.name} 회원
              </SheetTitle>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {member.phone || "연락처 미등록"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <div className="space-y-6">
          {/* 1. 소속 정보 섹션 */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> 소속 및 활동 이력
            </h3>

            <div className="space-y-3">
              {member.affiliations.map((aff) => (
                <div
                  key={aff.id}
                  className="bg-white border rounded-xl p-4 shadow-sm hover:ring-1 hover:ring-slate-200 transition-all"
                >
                  {/* 카드 헤더: 조직/기수 정보 */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {aff.organization.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {aff.generation.name} ·{" "}
                        {new Date(aff.createdAt).toLocaleDateString()} 가입신청
                      </div>
                    </div>
                    <Badge
                      variant={aff.status === "ACTIVE" ? "default" : "outline"}
                      className={
                        aff.status === "ACTIVE"
                          ? "bg-green-600 hover:bg-green-600"
                          : "text-orange-500 border-orange-200"
                      }
                    >
                      {aff.status === "ACTIVE" ? "활동중" : "승인대기"}
                    </Badge>
                  </div>

                  {/* 현재 직책 정보 */}
                  <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">
                      현재 직책:
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {aff.Position?.name || "일반회원"}
                    </span>
                  </div>

                  {/* 🌟 관리 액션 버튼들 */}
                  <div className="grid grid-cols-2 gap-2">
                    {aff.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> 승인하기
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600 h-8 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> 반려
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-slate-200"
                        >
                          <Settings2 className="w-3 h-3 mr-1" /> 직책 수정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-slate-400"
                        >
                          활동 중단
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 기타 정보/메모 (확장용) */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 관리자 참고사항
            </h4>
            <p className="text-[11px] text-blue-600/80 leading-relaxed">
              여러 소속을 가진 회원의 경우, 각 소속별로 승인 절차를 개별
              진행해야 합니다. 직책 수정 시 해당 기수의 조직도에 즉시
              반영됩니다.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
