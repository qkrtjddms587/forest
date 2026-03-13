"use server";

import { auth } from "@/auth";
import { isContentOwner, isOrgAdmin } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 1. 게시글 작성
export async function createPostAction(formData: FormData, orgId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as string) || "FREE"; // NOTICE or FREE

    // 🌟 프론트엔드에서 넘겨준 S3 이미지 URL 배열 꺼내기
    const imageUrls = formData.getAll("imageUrls") as string[];

    if (!title || !content)
      return { success: false, error: "제목과 내용을 입력해주세요." };

    // DB에 게시글 저장 및 이미지 URL 연결
    const post = await prisma.post.create({
      data: {
        title,
        content,
        type,
        authorId: Number(session.user.id),
        organizationId: orgId,

        // 🌟 업로드된 이미지 URL이 있다면 PostImage(또는 설정하신 이미지 테이블)에 함께 생성
        ...(imageUrls.length > 0 && {
          images: {
            create: imageUrls.map((url) => ({
              url: url,
            })),
          },
        }),
      },
    });

    // 캐시 날리기
    revalidatePath(`/m/org/${orgId}/community`);

    // 🌟 redirect 대신 깔끔하게 결과 객체를 리턴! (프론트엔드가 받아서 라우팅함)
    return { success: true, postId: post.id };
  } catch (error) {
    console.error("[CREATE_POST_ERROR]", error);
    return {
      success: false,
      error: "게시글 작성 중 서버 오류가 발생했습니다.",
    };
  }
}

export async function deletePostAction(postId: number, orgId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 1. 게시글 존재 및 권한 확인을 위해 조회
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) throw new Error("게시글을 찾을 수 없습니다.");

  // 2. 권한 체크 (본인인지 또는 관리자인지)
  // 세션의 role이 ADMIN이거나 작성자 ID가 본인 ID와 일치해야 함
  const isAdmin = isOrgAdmin(session.user, orgId);
  const isOwner = isContentOwner(session.user, post.authorId);

  if (!isAdmin && !isOwner) {
    throw new Error("삭제 권한이 없습니다.");
  }

  // 3. 삭제 수행 (PostImage 등은 onDelete: Cascade 설정에 의해 자동 삭제됨)
  await prisma.post.delete({
    where: { id: postId },
  });

  // 4. 캐시 갱신 및 목록으로 리다이렉트
  revalidatePath(`/m/org/${orgId}/community`);

  return { success: true };
}

export async function updatePostAction(
  postId: number,
  orgId: number,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = (formData.get("type") as string) || "FREE";

    if (!title || !content) {
      return { success: false, error: "제목과 내용을 입력해주세요." };
    }

    // 🌟 프론트에서 넘겨준 이미지 분리 추출 및 병합
    // 1. 기존 이미지 중 삭제 안 하고 남겨둔 것들
    const retainedUrls = formData.getAll("retainedImageUrls") as string[];
    // 2. 방금 폼에서 새로 첨부해서 S3에 올린 것들
    const newUrls = formData.getAll("newImageUrls") as string[];

    // 최종적으로 DB에 남아야 할 전체 이미지 리스트
    const finalImageUrls = [...retainedUrls, ...newUrls];

    // 🌟 권한 방어선: 수정하려는 글의 원래 주인이 맞는지 확인
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!existingPost) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    if (!isContentOwner(session.user, existingPost.authorId)) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    // 🌟 DB 업데이트 로직
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        type,

        // 이미지 교체 로직: 기존 연결을 싹 비우고, 합쳐진 리스트로 새로 연결 (가장 안전한 방식)
        images: {
          deleteMany: {},
          ...(finalImageUrls.length > 0 && {
            create: finalImageUrls.map((url) => ({
              url: url,
            })),
          }),
        },
      },
    });

    // 🌟 캐시 날리기 (목록과 상세 페이지 둘 다 갱신)
    revalidatePath(`/m/org/${orgId}/community`);
    revalidatePath(`/m/org/${orgId}/community/${postId}`);

    // create 액션처럼 결과 객체 리턴!
    return { success: true, postId: post.id };
  } catch (error) {
    console.error("[UPDATE_POST_ERROR]", error);
    return {
      success: false,
      error: "게시글 수정 중 서버 오류가 발생했습니다.",
    };
  }
}
