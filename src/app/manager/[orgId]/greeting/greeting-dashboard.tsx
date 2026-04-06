"use client";

import { useState, useTransition, useEffect } from "react";
import { saveGreeting, deleteGreeting } from "@/actions/greeting-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ImageIcon,
  PenTool,
} from "lucide-react";

type Affiliation = {
  id: number;
  member: { name: string };
  Position: { name: string } | null;
};

type Greeting = {
  id: number;
  affiliationId: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  signImageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  affiliation: Affiliation;
};

interface Props {
  greetings: Greeting[];
  availableAffiliations: Affiliation[]; // 아직 인사말이 없는 임원 목록
}

export function GreetingDashboard({ greetings, availableAffiliations }: Props) {
  const [isPending, startTransition] = useTransition();

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGreeting, setEditingGreeting] = useState<Greeting | null>(null);

  // 폼 입력 상태
  const [selectedAffId, setSelectedAffId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [signImageUrl, setSignImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  // 🌟 모달 열기 (생성 vs 수정)
  const openModal = (greeting?: Greeting) => {
    if (greeting) {
      // 수정 모드: 기존 데이터 채우기
      setEditingGreeting(greeting);
      setSelectedAffId(String(greeting.affiliationId));
      setTitle(greeting.title || "");
      setContent(greeting.content);
      setImageUrl(greeting.imageUrl || "");
      setSignImageUrl(greeting.signImageUrl || "");
      setIsActive(greeting.isActive);
      setDisplayOrder(greeting.displayOrder);
    } else {
      // 생성 모드: 초기화
      setEditingGreeting(null);
      setSelectedAffId("");
      setTitle("");
      setContent("");
      setImageUrl("");
      setSignImageUrl("");
      setIsActive(true);
      setDisplayOrder(0);
    }
    setIsModalOpen(true);
  };

  // 🌟 폼 제출 (저장)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffId) return alert("작성자를 선택해 주세요.");

    startTransition(async () => {
      const result = await saveGreeting(Number(selectedAffId), {
        title: title || null,
        content,
        imageUrl: imageUrl || null,
        signImageUrl: signImageUrl || null,
        isActive,
        displayOrder,
      });
      if (result.success) {
        setIsModalOpen(false);
      } else {
        alert(result.error);
      }
    });
  };

  // 🌟 삭제 처리
  const handleDelete = (id: number) => {
    if (!confirm("정말로 이 인사말을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const result = await deleteGreeting(id);
      if (!result.success) alert(result.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 컨트롤 바 */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800">등록된 인사말 목록</h3>
          <p className="text-sm text-slate-500">
            현재 {greetings.length}개의 인사말이 등록되어 있습니다.
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-brand-main hover:bg-brand-main/80 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> 새 인사말 추가
        </Button>
      </div>

      {/* 2. 등록된 인사말 카드 리스트 */}
      <div className="grid gap-4">
        {greetings.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl text-slate-500">
            등록된 인사말이 없습니다. 새 인사말을 추가해 주세요.
          </div>
        ) : (
          greetings.map((greet) => (
            <div
              key={greet.id}
              className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-6 hover:border-brand-main transition-colors"
            >
              {/* 순위 배지 */}
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg shrink-0">
                <span className="text-xs font-bold text-slate-500">순위</span>
                <span className="text-lg font-black text-slate-800">
                  {greet.displayOrder}
                </span>
              </div>

              {/* 작성자 정보 */}
              <div className="w-48 shrink-0 border-r pr-4">
                <div className="text-xs font-bold text-brand-main mb-1">
                  {greet.affiliation.Position?.name || "일반회원"}
                </div>
                <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  {greet.affiliation.member.name}
                  {greet.isActive ? (
                    <span title="노출 중">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </span>
                  ) : (
                    <span title="숨김">
                      <XCircle className="w-4 h-4 text-slate-300" />
                    </span>
                  )}
                </div>
              </div>

              {/* 요약 내용 */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate mb-1">
                  {greet.title || "(제목 없음)"}
                </h4>
                <p className="text-sm text-slate-500 wrap-break-word line-clamp-2 leading-relaxed">
                  {greet.content}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal(greet)}
                >
                  <Edit2 className="w-4 h-4 mr-1" /> 수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(greet.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. 새 인사말 / 수정 모달 폼 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGreeting ? "인사말 수정하기" : "새 인사말 작성하기"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* 작성자 선택 (수정 시에는 변경 불가) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                작성자(임원) 선택
              </label>
              {editingGreeting ? (
                <div className="p-3 bg-slate-100 rounded-md border text-sm font-medium text-slate-700">
                  [{editingGreeting.affiliation.Position?.name}]{" "}
                  {editingGreeting.affiliation.member.name} (변경 불가)
                </div>
              ) : (
                <select
                  value={selectedAffId}
                  onChange={(e) => setSelectedAffId(e.target.value)}
                  className="w-full border-slate-300 rounded-md text-sm shadow-sm p-2.5 bg-white"
                  required
                >
                  <option value="">-- 작성자를 선택하세요 --</option>
                  {availableAffiliations.map((aff) => (
                    <option key={aff.id} value={String(aff.id)}>
                      [{aff.Position?.name || "일반회원"}] {aff.member.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 노출 설정 */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">
                  노출 순서 (작을수록 상단)
                </label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full bg-white"
                />
              </div>
              <div className="flex flex-col justify-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    앱 화면에 노출하기
                  </span>
                </label>
              </div>
            </div>

            {/* 사진 URL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 프로필 사진 URL
                </label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <PenTool className="w-4 h-4" /> 서명(직인) URL
                </label>
                <Input
                  placeholder="https://..."
                  value={signImageUrl}
                  onChange={(e) => setSignImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                인사말 제목
              </label>
              <Input
                placeholder="예: 제1기 회장 김태우입니다."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                본문 내용
              </label>
              <Textarea
                placeholder="인사말 본문을 작성해 주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-slate-900 text-white"
              >
                {isPending ? "저장 중..." : "인사말 저장하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
