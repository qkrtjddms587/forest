"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, History, Info } from "lucide-react";

// ----------------------------------------------------------------------
// 1. 하드코딩 데이터 (회칙 내용)
// ----------------------------------------------------------------------
const BYLAWS_DATA = {
  lastUpdated: "2026년 1월 1일",
  version: "개정 5판",
  chapters: [
    {
      title: "제1장 총칙",
      articles: [
        {
          id: 1,
          title: "제1조 (명칭)",
          content: [
            "본 회는 '정치 연수원 31기 동기회'(이하 '본 회'라 한다)라 칭한다.",
          ],
        },
        {
          id: 2,
          title: "제2조 (목적)",
          content: [
            "본 회는 회원 상호 간의 친목을 도모하고, 상부상조하며 지역 사회 발전에 기여함을 목적으로 한다.",
          ],
        },
        {
          id: 3,
          title: "제3조 (사무소)",
          content: [
            "본 회의 사무소는 회장의 주소지 또는 회장이 지정하는 장소에 둔다.",
          ],
        },
      ],
    },
    {
      title: "제2장 회원",
      articles: [
        {
          id: 4,
          title: "제4조 (자격)",
          content: [
            "본 회의 회원은 정치 연수원 31기 수료생으로 한다.",
            "본 회의 취지에 찬동하고 소정의 입회비를 납부한 자로 한다.",
          ],
        },
        {
          id: 5,
          title: "제5조 (권리와 의무)",
          content: [
            "회원은 총회에 참석하여 발언권과 의결권을 가진다.",
            "회원은 회칙을 준수하고 회비 및 제 부담금을 납부할 의무를 진다.",
            "회원은 본 회의 사업 수행에 적극 협조하여야 한다.",
          ],
        },
      ],
    },
    {
      title: "제3장 임원",
      articles: [
        {
          id: 6,
          title: "제6조 (임원의 구성)",
          content: [
            "본 회는 다음의 임원을 둔다.",
            "1. 회장 1명",
            "2. 수석부회장 1명 및 부회장 약간 명",
            "3. 사무국장 1명",
            "4. 감사 2명",
          ],
        },
        {
          id: 7,
          title: "제7조 (임원의 임기)",
          content: [
            "임원의 임기는 2년으로 하되 연임할 수 있다.",
            "보선된 임원의 임기는 전임자의 잔여기간으로 한다.",
          ],
        },
      ],
    },
    {
      title: "제4장 재정",
      articles: [
        {
          id: 8,
          title: "제8조 (재정)",
          content: [
            "본 회의 재정은 회비, 찬조금, 기타 수입으로 충당한다.",
            "연회비는 매년 정기총회에서 결정한다.",
          ],
        },
        {
          id: 9,
          title: "제9조 (회계연도)",
          content: [
            "본 회의 회계연도는 매년 1월 1일부터 12월 31일까지로 한다.",
          ],
        },
      ],
    },
    {
      title: "부칙",
      articles: [
        {
          id: 10,
          title: "제1조 (시행일)",
          content: ["이 회칙은 2026년 1월 1일부터 시행한다."],
        },
        {
          id: 11,
          title: "제2조 (경과조치)",
          content: [
            "이 회칙 시행 이전에 행한 사항은 이 회칙에 의하여 행한 것으로 본다.",
          ],
        },
      ],
    },
  ],
};

// ----------------------------------------------------------------------
// 2. 메인 컴포넌트
// ----------------------------------------------------------------------
export default function BylawsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-brand-main border-brand-main bg-blue-50"
              >
                {BYLAWS_DATA.version}
              </Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <History className="w-3 h-3" /> 최종 개정:{" "}
                {BYLAWS_DATA.lastUpdated}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">회칙 및 규정</h1>
            <p className="text-slate-500 mt-1">
              우리 단체의 운영 기준과 회원들의 권리/의무를 정의합니다.
            </p>
          </div>

          {/* 다운로드 버튼 (기능은 나중에 구현) */}
          <Button variant="outline" className="gap-2 border-slate-300">
            <Download className="w-4 h-4" />
            PDF 다운로드
          </Button>
        </div>
      </div>

      {/* 본문 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-100/50 border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-slate-500" />
              회칙 전문
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 md:p-10">
            <div className="space-y-12">
              {BYLAWS_DATA.chapters.map((chapter, idx) => (
                <section key={idx}>
                  {/* 장(Chapter) 제목 */}
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 shrink-0">
                      {chapter.title}
                    </h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  {/* 조(Article) 목록 */}
                  <div className="space-y-6 pl-2 md:pl-4">
                    {chapter.articles.map((article) => (
                      <article key={article.id}>
                        <h3 className="font-bold text-slate-900 mb-2 text-md bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                          {article.title}
                        </h3>
                        <ul className="list-none space-y-1 text-slate-600 leading-relaxed text-sm md:text-base pl-1">
                          {article.content.map((line, i) => (
                            <li key={i} className="flex gap-2">
                              {/* 항 번호 (①, ② ...) 자동 생성 로직 또는 그냥 원점 */}
                              <span className="select-none text-slate-400">
                                {article.content.length > 1 ? `①` : "•"}
                                {/* 실제로는 ①, ② 등으로 매핑하는게 좋음 */}
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* 하단 푸터 */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-sm font-serif">
                위 회칙은 2026년 1월 1일 정기총회에서 의결되었습니다.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-slate-800 font-bold border-b-2 border-slate-800 pb-1">
                <span>회장 허 태 조</span>
                <span className="text-red-600 text-xs border border-red-600 px-0.5 ml-1">
                  인
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <div className="flex items-start gap-3 mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>회칙 개정 안내</strong>
            <p className="mt-1 opacity-90">
              회칙 개정은 재적 회원 과반수의 출석과 출석 회원 과반수의 찬성으로
              의결합니다. 개정 의견이 있으신 분은 사무국으로 문의 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
