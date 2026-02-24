// src/app/api/menus/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // 세션 확인용

export async function GET() {
  // 1. 요청 URL에서 파라미터(orgId) 추출

  // 2. 현재 로그인한 사용자 세션 가져오기
  const session = await auth();
  const orgId = "5";
  //   if (!session?.user?.id) {
  //     // 여기서 코드가 멈추고 에러를 뱉어냅니다!
  //     return NextResponse.json(
  //       { success: false, error: "Unauthorized" },
  //       { status: 401 }
  //     );
  //   }

  let menus = [];

  // ==========================================
  // [Case A] 특정 단체(orgId) 안에 들어왔을 때
  // ==========================================
  menus = [
    {
      id: "home",
      title: "홈",
      iconName: "house", // iOS SF Symbols 이름 (예: house.fill)에 매핑하기 좋게
      actionType: "NATIVE", // 심사 통과를 위해 네이티브 화면 호출
      target: "HomeScreen",
    },
    {
      id: "community",
      title: "게시판",
      iconName: "message",
      actionType: "WEBVIEW", // 알맹이는 웹뷰로 띄움
      target: `/org/${orgId}/community`,
    },
    {
      id: "members",
      title: "회원명부",
      iconName: "person.2",
      actionType: "WEBVIEW",
      target: `/org/${orgId}/search`,
    },
    {
      id: "profile",
      title: "내 정보",
      iconName: "person",
      actionType: "WEBVIEW", // 내 정보 화면도 네이티브를 추천합니다.
      target: "/profile",
    },
  ];

  // 4. JSON 형태로 응답 반환
  return NextResponse.json({
    success: true,
    data: {
      menus,
    },
  });
}
