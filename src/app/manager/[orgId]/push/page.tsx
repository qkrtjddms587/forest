import { notFound } from "next/navigation";
import { PushForm } from "./_components/push-form";
import { PushHistoryList } from "./_components/push-history-list";
import { BellRing, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default async function ManagerPushPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId: orgIdString } = await params;
  const orgId = Number(orgIdString);

  if (isNaN(orgId)) notFound();

  return (
    // 🌟 기존 AdminPushPage와 동일한 Wrapper 스타일 (max-w-2xl, p-6, space-y-8)
    <div className="mx-auto space-y-8">
      {/* 상단: 푸시 발송 폼 영역 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          푸시 발송
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          소속 단체의 활동(ACTIVE) 회원들에게 푸시 알림을 발송합니다.
        </p>
      </div>

      <PushForm orgId={orgId} />
      {/* 하단: 발송 내역 (히스토리) 영역 */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          최근 발송 내역
        </h2>
        <p className="text-slate-500 mt-2 text-sm mb-6">
          최근 발송된 푸시 알림의 성공 및 실패 여부를 확인할 수 있습니다.
        </p>

        <PushHistoryList orgId={orgId} />
      </div>
    </div>
  );
}
