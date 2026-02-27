import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/member/member-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function SearchPage() {
  const session = await auth();

  // 1. (임시) 데이터 가져오기 - 나중엔 실제 DB 쿼리로 교체
  // const members = await prisma.member.findMany(...)

  // 화면 구현 확인용 더미 데이터
  const members = [
    {
      id: 1,
      name: "류제석",
      role: "총동창회장",
      generation: "31기",
      company: "대구광역시무에타이협회장",
      phone: "010-1234-5678",
      address: "대구광역시동구금강로11****",
      imageUrl: "/placeholder-user.jpg", // public 폴더에 이미지 필요
    },
    {
      id: 2,
      name: "권오춘",
      role: "총동창회 직전회장",
      generation: "35기",
      company: "(주)아름다운건설대표이사",
      phone: "010-9876-5432",
      address: "",
    },
    {
      id: 3,
      name: "도재곤",
      role: "총동창회 수석부회장",
      generation: "28기",
      job: "기계",
      company: "(주)한국E&C대표이사",
      phone: "010-5555-7777",
      address: "대구시달성군현풍면테크노****",
    },
    {
      id: 4,
      name: "홍길동",
      generation: "40기",
      company: "미래지식포럼 사무국",
      phone: "010-0000-0000",
      address: "대구 수성구 달구벌대로",
    },
  ];

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col pb-20">
      {/* 1. 상단 검색 필터 영역 (Sticky 고정) */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
        <div className="p-3 space-y-3">
          {/* 드롭다운 + 검색창 한 줄 배치 */}
          <div className="flex gap-2">
            {/* 기수 선택 */}
            <Select>
              <SelectTrigger className="w-[75px] h-10 text-xs bg-slate-50">
                <SelectValue placeholder="기수" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="31">31기</SelectItem>
                <SelectItem value="32">32기</SelectItem>
              </SelectContent>
            </Select>

            {/* 직종 선택 */}
            <Select>
              <SelectTrigger className="w-[75px] h-10 text-xs bg-slate-50">
                <SelectValue placeholder="직종" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="cons">건설</SelectItem>
              </SelectContent>
            </Select>

            {/* 검색어 입력 */}
            <div className="relative flex-1">
              <Input
                className="h-10 text-sm bg-slate-50 pl-3 pr-9"
                placeholder="이름, 회사명 검색"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* 총 인원수 표시 */}
          <div className="text-sm font-bold text-slate-800 px-1">
            총 <span className="text-brand-main text-lg">{members.length}</span>{" "}
            명
          </div>
        </div>
      </div>

      {/* 2. 회원 리스트 영역 */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            name={member.name}
            role={member.role}
            generation={member.generation}
            company={member.company}
            job={member.job}
            phone={member.phone}
            address={member.address}
            imageUrl={member.imageUrl}
          />
        ))}

        {/* 데이터가 없을 때 */}
        {members.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
