"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { messaging } from "@/lib/firebase-admin";
import { isOrgAdmin } from "@/lib/auth/auth-utils";
// 🌟 팀장님이 만들어두신 lib에서 messaging 객체만 쏙 빼옵니다!

export async function sendAdminPushAction(formData: FormData) {
  try {
    // 1. 관리자 권한 체크 (필요에 따라 isOrgAdmin 등으로 변경)
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "권한이 없습니다." };
    }

    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const link = formData.get("link") as string; // 푸시 클릭 시 이동할 URL
    const orgId = formData.get("orgId") as string;

    if (!title || !body) {
      return { success: false, message: "제목과 내용을 모두 입력해주세요." };
    }

    // 2. DB에서 저장된 모든 기기 토큰 가져오기 (특정 단체만 보낼 경우 where 조건 추가)
    const pushTokens = await prisma.devicePushToken.findMany({
      select: { token: true },
    });

    const tokens = pushTokens.map((t) => t.token);

    if (tokens.length === 0) {
      return { success: false, message: "발송할 기기 토큰이 없습니다." };
    }

    // 3. 푸시 메시지 페이로드 구성
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        // 앱에서 클릭 시 해당 라우트로 이동시키기 위한 데이터
        url: link || "/",
      },
      tokens: tokens,
    };

    // 4. Firebase로 발송 (최대 500개씩 나눠서 보낼 수 있는 sendEachForMulticast 사용)
    const response = await messaging.sendEachForMulticast(message);

    // 5. 실패한 토큰 정리 (앱을 지웠거나 토큰이 만료된 경우 DB에서 삭제 처리하면 좋습니다)
    // 여기서는 간단히 결과만 반환합니다.
    return {
      success: true,
      message: `총 ${response.successCount}건 발송 성공, ${response.failureCount}건 실패`,
    };
  } catch (error) {
    console.error("푸시 발송 에러:", error);
    return {
      success: false,
      message: "푸시 발송 중 서버 오류가 발생했습니다.",
    };
  }
}

export async function sendGroupPushAction(
  orgId: number,
  title: string,
  body: string,
  data?: any,
) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("로그인이 필요합니다.");

    // 1. 권한 체크
    if (!isOrgAdmin(session.user, orgId)) {
      return { success: false, error: "푸시 발송 권한이 없습니다." };
    }

    // 2. 발송 대상 토큰 수집 (ACTIVE 상태인 회원들)
    const deviceTokens = await prisma.devicePushToken.findMany({
      where: {
        member: {
          affiliations: {
            some: {
              organizationId: orgId,
              status: "ACTIVE",
            },
          },
        },
      },
      select: { token: true },
    });

    if (deviceTokens.length === 0) {
      return { success: false, error: "푸시를 받을 수 있는 회원이 없습니다." };
    }

    // 3. 중복 토큰 제거
    const uniqueTokens = Array.from(new Set(deviceTokens.map((t) => t.token)));
    // 4. FCM 메시지 객체 조립
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        orgId: String(orgId),
        ...data,
      },
      tokens: uniqueTokens, // 최대 500개
    };

    // 🌟 5. 팀장님의 messaging 객체로 시원하게 발송!
    const response = await messaging.sendEachForMulticast(message);

    await prisma.pushHistory.create({
      data: {
        senderId: Number(session.user.id), // 발송자 ID
        title,
        body,
        link: data.url,
        // 전체 발송이면 null, 단체 발송이면 orgId
        organizationId: orgId ? Number(orgId) : null,
        successCount: response.successCount,
        failCount: response.failureCount,
      },
    });

    // 6. 만료된 좀비 토큰 DB 청소 로직
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            failedTokens.push(uniqueTokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await prisma.devicePushToken.deleteMany({
          where: { token: { in: failedTokens } },
        });
        console.log(
          `🧹 만료된 좀비 토큰 ${failedTokens.length}개 DB에서 삭제 완료`,
        );
      }
    }

    return {
      success: true,
      message: `총 ${response.successCount}명에게 푸시를 발송했습니다.`,
    };
  } catch (error) {
    console.error("FCM 푸시 발송 에러:", error);
    return { success: false, error: "푸시 발송 중 서버 오류가 발생했습니다." };
  }
}

export async function getPushHistoryAction(orgId: number, page: number = 0) {
  const pageSize = 10; // 한 번에 10개씩 가져옴

  try {
    const history = await prisma.pushHistory.findMany({
      where: { organizationId: orgId },
      include: {
        sender: { select: { name: true } }, // 발송자 이름 포함
      },
      orderBy: { createdAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    });

    return { success: true, data: history };
  } catch (error) {
    console.error("히스토리 조회 에러:", error);
    return { success: false, data: [] };
  }
}
