import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 상단 뒤로가기 버튼 */}
        <div className="flex justify-between items-center">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-slate-900"
            >
              ← 메인으로 돌아가기
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b pb-6 text-center space-y-4 pt-10">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              개인정보처리방침
            </CardTitle>
            <p className="text-sm text-slate-500">시행일자: 2026년 3월 1일</p>
          </CardHeader>

          <CardContent className="p-8 sm:p-12 bg-white">
            <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-8">
              <section className="space-y-3">
                <p>
                  <strong>한국보호산림협회</strong>(이하 '회사'라고
                  합니다)은(는) 개인정보보호법 등 관련 법령상의 개인정보보호
                  규정을 준수하며, 이용자의 개인정보 보호에 최선을 다하고
                  있습니다. 회사는 본 개인정보처리방침을 통하여 이용자가
                  제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
                  개인정보보호를 위해 어떠한 조치가 취해지고 있는지
                  알려드립니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제1조 (수집하는 개인정보의 항목 및 수집 방법)
                </h3>
                <p>
                  회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해
                  아래와 같은 개인정보를 수집하고 있습니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>필수항목:</strong> 이름, 휴대전화번호, 비밀번호
                  </li>
                  <li>
                    <strong>선택항목:</strong> 회사명, 주소
                  </li>
                  <li>
                    <strong>자동수집항목:</strong> 서비스 이용기록, 접속 로그,
                    쿠키, 접속 IP 정보, 기기 정보(푸시 토큰 등)
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제2조 (개인정보의 수집 및 이용 목적)
                </h3>
                <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>회원 관리:</strong> 회원제 서비스 이용에 따른
                    본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용
                    방지, 가입 의사 확인, 연령확인, 불만처리 등 민원처리,
                    고지사항 전달
                  </li>
                  <li>
                    <strong>서비스 제공:</strong> 소속 단체 및 기수 관리, 회비
                    납부 내역 관리, 커뮤니티(게시판) 이용 등
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제3조 (개인정보의 보유 및 이용기간)
                </h3>
                <p>
                  원칙적으로, 개인정보 수집 및 이용 목적이 달성된 후에는 해당
                  정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의
                  이유로 명시한 기간 동안 보존합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>회사 내부 방침에 의한 정보보유:</strong>{" "}
                    부정이용기록 (보존 이유: 부정 이용 방지, 보존 기간: 1년)
                  </li>
                  <li>
                    <strong>관련법령에 의한 정보보유:</strong> 전자상거래
                    등에서의 소비자보호에 관한 법률 등 관계법령의 규정에 의하여
                    보존할 필요가 있는 경우 (예: 대금결제 및 재화 등의 공급에
                    관한 기록 5년)
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제4조 (개인정보의 파기절차 및 방법)
                </h3>
                <p>
                  회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는
                  해당 정보를 지체없이 파기합니다. 파기절차 및 방법은 다음과
                  같습니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성
                    후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및
                    기타 관련 법령에 따라 일정 기간 저장된 후 혹은 즉시
                    파기됩니다.
                  </li>
                  <li>
                    <strong>파기방법:</strong> 전자적 파일 형태로 저장된
                    개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여
                    삭제합니다.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제5조 (이용자 및 법정대리인의 권리와 그 행사방법)
                </h3>
                <p>
                  이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나
                  수정할 수 있으며 가입해지를 요청할 수도 있습니다. 개인정보
                  조회, 수정을 위해서는 '마이페이지'를, 가입해지(동의철회)를
                  위해서는 '회원탈퇴'를 클릭하여 직접 열람, 정정 또는 탈퇴가
                  가능합니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  제6조 (개인정보 보호책임자 및 담당자 연락처)
                </h3>
                <p>
                  회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을
                  처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를
                  지정하고 있습니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>책임자 성명:</strong> 이주현
                  </li>
                  <li>
                    <strong>전화번호:</strong> 053-267-0880
                  </li>
                  <li>
                    <strong>이메일:</strong> barunidea0880@naver.com
                  </li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-slate-400 text-sm pb-8">
          © {new Date().getFullYear()} 한국산림보호협회. All rights reserved.
        </div>
      </div>
    </div>
  );
}
