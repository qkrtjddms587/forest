import { createPostAction } from "@/actions/post-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/common/back-button";

export default async function WritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = Number(id);
  const session = await auth();

  // 관리자 여부 확인 (공지사항 작성 권한용)
  const affiliation = await prisma.affiliation.findFirst({
    where: {
      memberId: Number(session?.user?.id),
      organizationId: orgId,
    },
  });

  const isAdmin =
    affiliation?.role === "ADMIN" || affiliation?.role === "MANAGER";

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">글쓰기</h1>

      <form
        action={async (formData) => {
          "use server";
          await createPostAction(formData, orgId);
        }}
        className="space-y-4"
      >
        {/* 카테고리 선택 (관리자만 공지 가능) */}
        <div className="w-[140px]">
          <Select name="type" defaultValue="FREE">
            <SelectTrigger>
              <SelectValue placeholder="분류" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">자유게시판</SelectItem>
              {isAdmin && <SelectItem value="NOTICE">공지사항</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <Input
          name="title"
          placeholder="제목을 입력하세요"
          required
          className="text-lg py-6"
        />

        <Textarea
          name="content"
          placeholder="내용을 입력하세요. 서로를 배려하는 고운 말을 사용해주세요."
          required
          className="min-h-[400px] resize-none text-base leading-relaxed p-4"
        />

        <div className="flex gap-2 justify-end pt-2">
          <BackButton />
          <Button
            type="submit"
            className="bg-brand-main hover:bg-brand-main/90 w-24"
          >
            등록
          </Button>
        </div>
      </form>
    </div>
  );
}
