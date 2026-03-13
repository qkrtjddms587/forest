"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { messaging } from "@/lib/firebase-admin";
import { isOrgAdmin } from "@/lib/auth/auth-utils";
// 🌟 팀장님이 만들어두신 lib에서 messaging 객체만 쏙 빼옵니다!

export async function sendGroupPushAction(
  orgId: number,
  title: string,
  body: string,
  data?: any
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

    console.log(uniqueTokens);
    console.log(message);
    console.log(response);
    console.log(
      `[FCM 발송 결과] 성공: ${response.successCount}건, 실패: ${response.failureCount}건`
    );

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
          `🧹 만료된 좀비 토큰 ${failedTokens.length}개 DB에서 삭제 완료`
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
