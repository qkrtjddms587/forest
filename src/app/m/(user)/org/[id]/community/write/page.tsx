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
import { WriteForm } from "@/components/community/write-form";
import { isOrgAdmin } from "@/lib/auth/auth-utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function WritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = Number(id);
  const session = await auth();

  const isAdmin = isOrgAdmin(session?.user, orgId);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-16 md:p-8">
      <div className="mb-6">
        <Link
          href={`/m/org/${id}/community`}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          목록으로
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-6">글쓰기</h1>
      </div>
      <WriteForm orgId={orgId} isAdmin={isAdmin} />
    </div>
  );
}
