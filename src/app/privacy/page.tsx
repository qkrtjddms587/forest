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
            <div className="mx-auto w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              개인정보처리방침
            </CardTitle>
            <p className="text-sm text-slate-500">시행일자: 2026년 3월 1일</p>
          </CardHeader>

          <CardContent className="p-8 sm:p-12 bg-white">
            <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-10">
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  1. 개인정보 처리방침
                </h3>
                <p>
                  <strong>사)한국산림보호협회</strong>(이하 "협회")은 이용자의
                  ‘동의를 기반으로 개인정보를 수집·이용 및 제공’하고 있으며,
                  ‘이용자의 권리 (개인정보 자기결정권)를 적극적으로 보장’합니다.
                  협회는 정보통신서비스제공자가 준수하여야 하는 대한민국의 관계
                  법령 및 개인정보보호 규정, 가이드라인을 준수하고 있습니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  2. 개인정보 수집
                </h3>
                <p>
                  서비스 제공을 위한 필요 최소한의 개인정보를 수집하고 있습니다.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="font-semibold text-slate-800">
                      [계정가입 시]
                    </p>
                    <ul className="list-disc pl-5">
                      <li>
                        <strong>필수:</strong> 비밀번호, 이름, 연락처, 생년월일,
                        성별, 서비스 이용내역, 구매 및 결제 내역
                      </li>
                      <li>
                        <strong>선택:</strong> 배송지정보(수령인명, 배송지 주소,
                        전화번호)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      [본인인증/법정대리인 동의 시]
                    </p>
                    <p>
                      이름, 성별, 생년월일, 휴대폰번호, 통신사업자, 내/외국인
                      여부, 암호화된 이용자 확인값(CI), 중복가입확인정보(DI)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      [유료서비스 이용/환불 시]
                    </p>
                    <p>
                      카드사명, 계좌번호, 예금주명, 현금영수증 카드번호 등 결제
                      및 환불에 필요한 정보
                    </p>
                  </div>
                </div>

                <p className="mt-4 italic">
                  * PC/모바일 이용 과정에서 단말기정보(OS, 디바이스 아이디 등),
                  IP주소, 쿠키, 방문일시 등이 자동 생성되어 수집될 수 있습니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  3. 개인정보 이용
                </h3>
                <p>
                  수집한 정보를 회원 관리, 서비스 제공 및 개선, 신규 서비스 개발
                  등을 위해 이용합니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    회원 식별 및 가입의사 확인, 본인/연령 확인, 부정이용 방지
                  </li>
                  <li>
                    메시지 전송, 활동내역 알림, 이용자 검색 및 등록 기능 제공
                  </li>
                  <li>
                    맞춤형 컨텐츠 추천 및 마케팅 활용, 통계 기반 서비스 개선
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  4. 개인정보 제공 및 위탁
                </h3>
                <p>
                  협회는 이용자의 별도 동의가 있는 경우나 법령에 규정된 경우를
                  제외하고는 개인정보를 제3자에게 제공하지 않습니다. 원활한
                  서비스 제공을 위해 필요한 업무 중 일부(본인인증, 결제 등)를
                  외부 업체에 위탁하고 있습니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  5. 개인정보 파기
                </h3>
                <p>
                  개인정보는 목적이 달성되면 지체 없이 파기합니다. 전자적 파일은
                  재생할 수 없는 방법으로 삭제하며, 서면 자료는 분쇄/소각합니다.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>탈퇴 회원:</strong> 탈퇴일로부터 최대 3년간 보관 후
                    파기
                  </li>
                  <li>
                    <strong>개인정보 유효기간제:</strong> 1년간 미이용 시 분리
                    보관 (분리 후 4년 뒤 파기)
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  6. 이용자 및 법정대리인의 권리
                </h3>
                <p>
                  이용자는 언제든지 자신의 개인정보를 조회, 수정하거나 가입
                  해지를 요청할 수 있습니다. 만 14세 미만 아동의 경우
                  법정대리인이 해당 권리를 행사할 수 있습니다. 고객센터를 통해
                  서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  7. 쿠키(Cookie) 운영 및 거부
                </h3>
                <p>
                  협회는 개인화된 서비스 제공을 위해 쿠키를 사용합니다. 이용자는
                  웹 브라우저 설정을 통해 모든 쿠키를 허용하거나 거부할 수 있는
                  선택권을 가집니다.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  8. 개인정보의 안전성 확보 조치
                </h3>
                <p>
                  협회는 이용자의 소중한 개인정보 보호를 위해 다음과 같은 노력을
                  하고 있습니다.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>데이터 전송 시 암호화 통신 및 중요 정보의 암호화 보관</li>
                  <li>해킹 및 바이러스 차단을 위한 24시간 감시 시스템 운영</li>
                  <li>
                    개인정보 취급 직원의 최소화 및 정기적인 보안 교육 실시
                  </li>
                </ul>
              </section>

              <section className="space-y-3 bg-slate-50 p-6 rounded-lg border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  9. 개인정보 보호책임자 및 연락처
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      기관명
                    </p>
                    <p className="font-medium">사)한국산림보호협회</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      보호책임자
                    </p>
                    <p className="font-medium">허 태 조</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      대표전화
                    </p>
                    <p className="font-medium underline decoration-slate-200">
                      053-745-2244
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                      주소
                    </p>
                    <p className="font-medium text-xs">
                      대구 동구 동대구로 498번지 동림빌딩 4층
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">
                  10. 개정 전 고지의무
                </h3>
                <p>
                  본 방침이 변경되는 경우 홈페이지를 통해 게시하며, 변경 사항은
                  게시한 날로부터 7일 후부터 효력이 발생합니다. 다만 권리의
                  중대한 변경 시 최소 30일 전에 고지합니다.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-slate-400 text-sm pb-8">
          © {new Date().getFullYear()} 사단법인 한국산림보호협회. All rights
          reserved.
        </div>
      </div>
    </div>
  );
}
