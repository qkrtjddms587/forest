"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Loader2, Upload, Download } from "lucide-react"; // Download 아이콘 추가
import { bulkCreateMembersAction } from "@/actions/member-actions";

export function BulkCreateMemeberDialog({ organizations, generations }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [orgId, setOrgId] = useState("");
  const [genId, setGenId] = useState("");
  const [result, setResult] = useState<any>(null);

  // 🌟 엑셀 템플릿 다운로드 함수
  const handleDownloadTemplate = () => {
    // '아이디' 컬럼 삭제! 훨씬 심플해졌습니다.
    const templateData = [
      // 🌟 헤더에 '주소' 추가
      ["이름", "전화번호", "비밀번호", "회사명", "주소"],
      [
        "홍길동",
        "010-1234-5678",
        "password123!",
        "구글 코리아",
        "서울시 강남구 테헤란로 123",
      ],
      [
        "김철수",
        "010-8765-4321",
        "password123!",
        "애플",
        "대구광역시 수성구 달구벌대로 456",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    // 열 너비 조절
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "회원목록");
    XLSX.writeFile(workbook, "회원_일괄등록_양식.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessExcel = async () => {
    if (!file || !orgId || !genId)
      return alert("소속, 기수, 파일을 모두 선택해주세요.");

    startTransition(async () => {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("엑셀 파일에 데이터가 없습니다.");
        return;
      }

      const plainJsonData = JSON.parse(JSON.stringify(jsonData));

      const res = await bulkCreateMembersAction(
        plainJsonData,
        Number(orgId),
        Number(genId)
      );
      setResult(res);
    });
  };

  const resetState = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFile(null);
      setResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-green-600 text-green-700 hover:bg-green-50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          엑셀 일괄 등록
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>엑셀 일괄 등록</DialogTitle>
          <DialogDescription>
            지정된 양식의 엑셀 파일을 업로드하여 다수의 회원을 한 번에
            등록합니다.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 mt-4">
            {/* 🌟 템플릿 안내 및 다운로드 버튼 영역 */}
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 border border-slate-200 flex flex-col gap-3">
              <div>
                <p className="font-bold text-slate-800 mb-1">
                  💡 엑셀 양식 작성 규칙
                </p>
                <ul className="list-disc pl-5 space-y-1 mb-2">
                  <li>
                    필수 항목:{" "}
                    <span className="font-bold text-blue-600">
                      이름, 전화번호, 비밀번호
                    </span>
                  </li>
                  <li>
                    선택 항목:{" "}
                    <span className="font-bold text-slate-700">
                      회사명, 주소
                    </span>{" "}
                    (빈칸으로 두어도 됩니다)
                  </li>
                  <li>
                    <span className="font-bold text-red-500">
                      유저의 아이디는 전화번호에서 하이픈(-)을 제외한 숫자로
                      자동 지정됩니다.
                    </span>
                  </li>
                </ul>
                <p>제공된 템플릿을 다운로드하여 데이터를 채워 넣어주세요.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                등록용 엑셀 양식 다운로드
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>공통 적용 조직</Label>
                <Select onValueChange={setOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="조직 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>공통 적용 기수</Label>
                <Select onValueChange={setGenId}>
                  <SelectTrigger>
                    <SelectValue placeholder="기수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {generations.map((gen: any) => (
                      <SelectItem key={gen.id} value={String(gen.id)}>
                        {gen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>작성 완료된 엑셀 업로드</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="flex-1 border border-slate-200 rounded-md p-2 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleProcessExcel}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isPending || !file || !orgId || !genId}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isPending ? "데이터 처리 중..." : "엑셀 업로드 및 등록"}
            </Button>
          </div>
        ) : (
          // 결과 화면 (기존과 동일)
          <div className="space-y-6 mt-4 py-4 text-center">
            {/* ... 결과 렌더링 생략 ... */}
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">처리 완료</h3>
            <div className="flex justify-center gap-8 bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-sm text-slate-500">성공</p>
                <p className="text-2xl font-black text-green-600">
                  {result.successCount}건
                </p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="text-sm text-slate-500">실패 (중복 등)</p>
                <p className="text-2xl font-black text-red-500">
                  {result.failCount}건
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-left bg-red-50 p-4 rounded-md h-32 overflow-y-auto text-xs text-red-600 border border-red-100">
                <p className="font-bold mb-2">오류 내역:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {result.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
              variant="outline"
            >
              닫기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
