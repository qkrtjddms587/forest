"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  User,
  CornerDownRight,
  Coins, // 아이콘 추가
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createPositionAction,
  deletePositionAction,
} from "@/actions/admin-position-actions";
// import { DuesCycleType } from "@/types/position-types"; // 타입 파일이 없다면 아래 상수를 직접 사용

// ✅ 납부 주기 맵핑 상수 (타입 파일이 없어도 동작하도록 여기에 정의)
const DuesCycleMap: Record<string, string> = {
  NONE: "회비 없음",
  MONTHLY: "매월 납부",
  QUARTERLY: "분기 납부 (3개월)",
  YEARLY: "매년 납부",
};

// 트리 노드 타입 (DB에서 받아오는 데이터 구조)
interface PositionNode {
  id: number;
  name: string;
  parentId: number | null;
  isExecutive: boolean;
  duesAmount: number; // 👈 추가됨
  duesCycle: string; // 👈 추가됨
  children?: PositionNode[];
}

// 🌳 재귀적 트리 아이템 컴포넌트
function OrgTreeItem({
  node,
  onAddChild,
  onDelete,
}: {
  node: PositionNode;
  onAddChild: (parentId: number) => void;
  onDelete: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  // 회비 정보가 있는지 체크
  const hasDues = node.duesCycle !== "NONE" && node.duesAmount > 0;
  const cycleLabel = DuesCycleMap[node.duesCycle]?.split(" ")[0] || ""; // "매월", "매년" 만 추출

  return (
    <div className="pl-4 border-l border-slate-200 ml-2">
      <div className="flex items-center gap-2 py-2 group">
        {/* 접기/펼치기 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            ))}
        </button>

        {/* 직책 이름 표시 */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium ${
            node.isExecutive
              ? "bg-purple-50 border-purple-200 text-purple-700"
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          {node.isExecutive && <User className="w-3 h-3" />}
          {node.name}
        </div>

        {/* 💰 회비 정보 뱃지 (트리에서도 보이게 추가) */}
        {hasDues && (
          <div className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <Coins className="w-3 h-3" />
            <span>
              {cycleLabel} {node.duesAmount.toLocaleString()}원
            </span>
          </div>
        )}

        {/* 액션 버튼 (호버 시 등장) */}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-auto md:ml-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-green-600 hover:bg-green-50"
            onClick={() => onAddChild(node.id)}
            title="하위 직책 추가"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-red-500 hover:bg-red-50"
            onClick={() => onDelete(node.id)}
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 자식 렌더링 */}
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <OrgTreeItem
              key={child.id}
              node={child}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 🏗️ 메인 에디터 컴포넌트
export function OrgChartEditor({
  positions,
  genId,
}: {
  positions: any[];
  genId: number;
}) {
  // 입력 폼 상태 관리
  const [newPositionName, setNewPositionName] = useState("");
  const [isExecutive, setIsExecutive] = useState(false);
  const [targetParentId, setTargetParentId] = useState<number | null>(null);

  // 💰 회비 관련 상태 추가
  const [duesCycle, setDuesCycle] = useState("NONE");
  const [duesAmount, setDuesAmount] = useState("");

  // 트리 조립 함수 (Flat -> Tree)
  const buildTree = () => {
    const map = new Map();
    const roots: PositionNode[] = [];
    positions.forEach((p) => map.set(p.id, { ...p, children: [] }));
    positions.forEach((p) => {
      if (p.parentId) {
        const parent = map.get(p.parentId);
        if (parent) parent.children.push(map.get(p.id));
      } else {
        roots.push(map.get(p.id));
      }
    });
    return roots;
  };

  const treeData = buildTree();

  // 핸들러: 추가
  const handleCreate = async () => {
    if (!newPositionName.trim()) return alert("직책 이름을 입력하세요");

    // 금액 콤마 제거 후 숫자로 변환
    const amountInt = parseInt(duesAmount.replace(/,/g, "")) || 0;

    const result = await createPositionAction({
      generationId: genId,
      name: newPositionName,
      parentId: targetParentId,
      isExecutive,
      duesCycle, // 추가됨
      duesAmount: amountInt, // 추가됨
    });

    if (result.success) {
      // 폼 초기화
      setNewPositionName("");
      setIsExecutive(false);
      setDuesCycle("NONE");
      setDuesAmount("");
      setTargetParentId(null);
    } else {
      alert("오류 발생");
    }
  };

  // 핸들러: 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const result = await deletePositionAction(id);
    if (!result.success) alert(result.message);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 왼쪽: 트리 뷰 */}
      <div className="md:col-span-2 border rounded-xl bg-slate-50 p-6 min-h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-slate-800">조직도 구조</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTargetParentId(null)}
          >
            <CornerDownRight className="w-4 h-4 mr-2" /> 최상위 직책 추가 모드
          </Button>
        </div>

        {treeData.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            등록된 직책이 없습니다.
          </div>
        ) : (
          treeData.map((node) => (
            <OrgTreeItem
              key={node.id}
              node={node}
              onAddChild={(parentId) => setTargetParentId(parentId)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 오른쪽: 입력 폼 (Sticky) */}
      <div className="md:col-span-1">
        <div className="border rounded-xl bg-white p-6 shadow-sm sticky top-6 space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">
            {targetParentId
              ? `"${
                  positions.find((p) => p.id === targetParentId)?.name
                }" 하위에 추가`
              : "최상위 직책 추가"}
          </h3>

          {/* 1. 직책 이름 */}
          <div className="space-y-2">
            <Label>직책 이름</Label>
            <Input
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              placeholder="예: 기획팀장"
            />
          </div>

          {/* 2. 임원 여부 */}
          <div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50">
            <Label className="cursor-pointer" htmlFor="exec-mode">
              임원진 포함
            </Label>
            <Switch
              id="exec-mode"
              checked={isExecutive}
              onCheckedChange={setIsExecutive}
            />
          </div>

          {/* 💰 3. 회비 규칙 설정 (신규 추가) */}
          <div className="space-y-3 pt-2">
            <Label className="text-slate-900 font-bold flex items-center gap-2">
              <Coins className="w-4 h-4" /> 회비 규칙
            </Label>

            <div className="grid grid-cols-2 gap-2">
              {/* 주기 선택 */}
              <Select value={duesCycle} onValueChange={setDuesCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="주기" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DuesCycleMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 금액 입력 */}
              <div className="relative">
                <Input
                  type="text"
                  value={duesAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, ""); // 숫자만
                    setDuesAmount(Number(val).toLocaleString()); // 콤마 포맷
                  }}
                  disabled={duesCycle === "NONE"}
                  placeholder="0"
                  className="text-right pr-8"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400">
                  원
                </span>
              </div>
            </div>

            {/* 입력 결과 요약 (주기가 있을 때만 표시) */}
            {duesCycle !== "NONE" && duesAmount && duesAmount !== "0" && (
              <p className="text-xs text-right text-blue-600 font-bold bg-blue-50 p-2 rounded">
                💡 {DuesCycleMap[duesCycle]} {duesAmount}원을 납부합니다.
              </p>
            )}
          </div>

          {/* 저장 버튼 */}
          <Button
            className="w-full bg-brand-main h-11 text-md mt-2"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            {targetParentId ? "하위 직책 생성" : "최상위 직책 생성"}
          </Button>

          {targetParentId && (
            <Button
              variant="ghost"
              className="w-full text-slate-400 h-8 text-xs"
              onClick={() => setTargetParentId(null)}
            >
              취소하고 최상위 추가하기
            </Button>
          )}

          <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded leading-relaxed">
            * <strong>임원 여부</strong> 체크 시 조직도에서 강조됩니다.
            <br />* <strong>회비 규칙</strong>을 설정하면 미납 내역이 자동으로
            생성됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
