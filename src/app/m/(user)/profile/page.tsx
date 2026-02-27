import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EditProfileDialog } from "./edit-profile-dialog"; // 👈 추가
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findUnique({
    where: { id: Number(session.user.id) },
    include: {
      affiliations: {
        include: { organization: true, generation: true, Position: true },
      },
    },
  });

  if (!member) return null;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">내 정보</h1>
        {/* 👇 수정 버튼 (Dialog) */}
        <EditProfileDialog member={member} />
      </div>

      {/* 기본 정보 카드 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage
              src={
                `https://randomuser.me/api/portraits/men/${member.id}.jpg` || ""
              }
            />
            <AvatarFallback className="bg-slate-200 text-xl font-bold text-slate-500">
              {member.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{member.name}</CardTitle>
            <p className="text-sm text-gray-500">{member.phone}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-3 text-sm border-t pt-4">
            {/* 회사/직종 정보 표시 */}
            <div className="grid grid-cols-3">
              <span className="text-gray-500">회사</span>
              <span className="col-span-2 font-medium">
                {member.company || "-"}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-gray-500">직종</span>
              <span className="col-span-2 font-medium">
                {member.job || "-"}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-gray-500">주소</span>
              <span className="col-span-2 font-medium">
                {member.address || "-"}
              </span>
            </div>

            <div className="grid grid-cols-3 mt-2 pt-2 border-t border-dashed">
              <span className="text-gray-500">가입일</span>
              <span className="col-span-2 text-gray-400">
                {new Date(member.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 가입된 소속 목록 (기존 유지) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">소속 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {member.affiliations.map((aff) => (
              <div
                key={aff.id}
                className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{aff.organization.name}</span>
                  <Badge variant="outline">{aff.generation.name}</Badge>
                </div>
                {/* 직함이 있으면 표시 */}
                {aff.Position?.name ? (
                  <span className="text-sm text-brand-main font-bold">
                    {aff.Position.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">일반회원</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="pt-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button className="w-full h-12 cursor-pointer">
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </form>
      </div>
    </div>
  );
}
