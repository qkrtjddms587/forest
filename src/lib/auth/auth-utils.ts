import { Session } from "next-auth";

/**
 * 🌟 해당 조직(orgId)의 관리자(ADMIN, MANAGER)인지 확인
 */
export function isOrgAdmin(
  user: Session["user"] | undefined | null,
  orgId: number
) {
  if (!user || !user.affiliations) return false;

  const affiliation = user.affiliations.find(
    (a: any) => a.organizationId === orgId
  );

  return affiliation?.role === "ADMIN" || affiliation?.role === "MANAGER";
}

/**
 * 🌟 해당 콘텐츠의 작성자 본인인지 확인
 */
export function isContentOwner(
  user: Session["user"] | undefined | null,
  authorId: number
) {
  if (!user || !user.id) return false;

  return Number(user.id) === authorId;
}
