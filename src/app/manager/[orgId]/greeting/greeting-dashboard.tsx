"use client";

import { useState, useTransition } from "react";
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
  Search, // 🌟 추가
  Check, // 🌟 추가
} from "lucide-react";
import { SingleImageUploader } from "../banners/_components/single-image-uploader";

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
  availableAffiliations: Affiliation[];
}

export function GreetingDashboard({ greetings, availableAffiliations }: Props) {
  const [isPending, startTransition] = useTransition();

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

  // 🌟 검색형 드롭다운을 위한 상태 추가
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🌟 검색어 기반으로 임원 목록 필터링
  const filteredAffiliations = availableAffiliations.filter(
    (aff) =>
      aff.member.name.includes(searchQuery) ||
      (aff.Position?.name || "일반회원").includes(searchQuery),
  );

  // 모달 열기 초기화
  const openModal = (greeting?: Greeting) => {
    if (greeting) {
      setEditingGreeting(greeting);
      setSelectedAffId(String(greeting.affiliationId));
      // 수정 모드일 때 검색창에 기존 작성자 이름 세팅
      setSearchQuery(
        `[${greeting.affiliation.Position?.name || "일반회원"}] ${greeting.affiliation.member.name}`,
      );
      setTitle(greeting.title || "");
      setContent(greeting.content);
      setImageUrl(greeting.imageUrl || "");
      setSignImageUrl(greeting.signImageUrl || "");
      setIsActive(greeting.isActive);
      setDisplayOrder(greeting.displayOrder);
    } else {
      setEditingGreeting(null);
      setSelectedAffId("");
      setSearchQuery(""); // 🌟 검색어 초기화
      setIsDropdownOpen(false);
      setTitle("");
      setContent("");
      setImageUrl("");
      setSignImageUrl("");
      setIsActive(true);
      setDisplayOrder(0);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffId) return alert("작성자를 검색하여 정확히 선택해 주세요.");

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

      {/* 2. 등록된 인사말 리스트 (기존과 동일) */}
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
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg shrink-0">
                <span className="text-xs font-bold text-slate-500">순위</span>
                <span className="text-lg font-black text-slate-800">
                  {greet.displayOrder}
                </span>
              </div>

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

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 truncate mb-1">
                  {greet.title || "(제목 없음)"}
                </h4>
                <p className="text-sm text-slate-500 wrap-break-word line-clamp-2 leading-relaxed">
                  {greet.content}
                </p>
              </div>

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

      {/* 3. 모달 폼 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGreeting ? "인사말 수정하기" : "새 인사말 작성하기"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* 🌟 작성자 선택 (검색형 드롭다운) */}
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-slate-700">
                작성자(임원) 검색 및 선택
              </label>

              {editingGreeting ? (
                // 수정 시에는 작성자 변경 불가
                <div className="p-3 bg-slate-100 rounded-md border text-sm font-medium text-slate-700">
                  [{editingGreeting.affiliation.Position?.name || "일반회원"}]{" "}
                  {editingGreeting.affiliation.member.name} (변경 불가)
                </div>
              ) : (
                // 생성 시 검색 컴포넌트 노출
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="이름이나 직책을 검색하세요 (예: 김태우, 회장)"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedAffId(""); // 검색어를 수정하면 기존 선택이 풀리도록 방어
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setIsDropdownOpen(false), 200)
                      } // 클릭 이벤트를 위해 약간 딜레이
                      className="pl-9 bg-white"
                      required
                    />
                  </div>

                  {/* 자동완성 드롭다운 목록 */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredAffiliations.length > 0 ? (
                        filteredAffiliations.map((aff) => (
                          <div
                            key={aff.id}
                            className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center transition-colors"
                            // onClick 대신 onMouseDown을 써야 onBlur보다 먼저 실행됩니다!
                            onMouseDown={() => {
                              setSelectedAffId(String(aff.id));
                              setSearchQuery(
                                `[${aff.Position?.name || "일반회원"}] ${aff.member.name}`,
                              );
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium text-slate-700">
                              <span className="text-brand-main mr-1">
                                [{aff.Position?.name || "일반회원"}]
                              </span>
                              {aff.member.name}
                            </span>
                            {selectedAffId === String(aff.id) && (
                              <Check className="w-4 h-4 text-brand-main" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-sm text-slate-400 text-center flex flex-col items-center">
                          <Search className="w-6 h-6 mb-2 opacity-20" />
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-brand-main rounded"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    앱 화면에 노출하기
                  </span>
                </label>
              </div>
            </div>

            {/* 사진 & 서명 업로드 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <ImageIcon className="w-4 h-4" /> 프로필 사진
                </label>
                <SingleImageUploader
                  imageUrl={imageUrl}
                  onUploadComplete={setImageUrl}
                  folder="greetings/profiles"
                />
                <p className="text-xs text-slate-400">
                  배경이 투명한 PNG 파일이나 정방형(1:1) 비율을 권장합니다.
                </p>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <PenTool className="w-4 h-4" /> 서명 또는 직인
                </label>
                <SingleImageUploader
                  imageUrl={signImageUrl}
                  onUploadComplete={setSignImageUrl}
                  folder="greetings/signatures"
                />
                <p className="text-xs text-slate-400">
                  하단에 배치될 회장/임원님의 서명이나 도장 이미지를 올려주세요.
                </p>
              </div>
            </div>

            {/* 본문 제목/내용 */}
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
                className="min-h-[200px] leading-relaxed resize-none"
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
                className="bg-brand-main text-white hover:bg-brand-main/90"
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
