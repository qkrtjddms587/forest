"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 기존 배너 등록 액션 (그대로 유지)
export async function createBannerAction(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const position = formData.get("position") as string;
    const orgId = formData.get("organizationId") as string;
    const displayOrder = Number(formData.get("displayOrder")) || 0;
    const isActive = formData.get("isActive") === "on";

    // 날짜 처리 (값이 있으면 Date 객체로, 없으면 null)
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (!imageUrl) {
      return { success: false, error: "이미지 URL은 필수입니다." };
    }

    await prisma.banner.create({
      data: {
        title: title || null,
        imageUrl,
        linkUrl: linkUrl || null,
        organizationId: orgId && orgId !== "all" ? Number(orgId) : null,
        displayOrder,
        isActive,
        startDate,
        endDate,
      },
    });

    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    console.error("[CREATE_BANNER_ERROR]", error);
    return { success: false, error: "배너 등록 중 오류가 발생했습니다." };
  }
}

// 🌟 2. 새로 추가된 배너 수정 액션 (기존 폼 양식에 완벽 호환)
export async function updateBannerAction(formData: FormData) {
  try {
    // 식별자
    const id = Number(formData.get("bannerId"));

    // 텍스트 데이터
    const title = formData.get("title") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const orgId = formData.get("organizationId") as string;
    const displayOrder = Number(formData.get("displayOrder")) || 0;

    // Checkbox는 "on", Switch 컴포넌트는 "true"로 올 수 있으므로 둘 다 체크
    const isActiveValue = formData.get("isActive");
    const isActive = isActiveValue === "on" || isActiveValue === "true";

    // 날짜 처리
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (!id) {
      return { success: false, error: "수정할 배너 ID가 필요합니다." };
    }

    // 기존 데이터 조회 (이미지 URL이 안 넘어왔을 경우 기존 값 유지용)
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return { success: false, error: "존재하지 않는 배너입니다." };
    }

    await prisma.banner.update({
      where: { id },
      data: {
        title: title || null,
        // 클라이언트에서 새 이미지를 안 보냈으면 기존 이미지 URL을 그대로 씁니다.
        imageUrl: imageUrl || existingBanner.imageUrl,
        linkUrl: linkUrl || null,
        organizationId: orgId && orgId !== "all" ? Number(orgId) : null,
        displayOrder,
        isActive,
        startDate,
        endDate,
      },
    });

    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_BANNER_ERROR]", error);
    return { success: false, error: "배너 수정 중 오류가 발생했습니다." };
  }
}

// 🌟 3. 기존 배너 삭제 액션 (에러 로그만 살짝 보강)
export async function deleteBannerAction(id: number) {
  try {
    await prisma.banner.delete({ where: { id } });
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_BANNER_ERROR]", error);
    return { success: false, error: "배너 삭제 실패" };
  }
}
