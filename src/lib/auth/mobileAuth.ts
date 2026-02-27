import { verifyAccessToken } from "@/lib/auth/tokens";

export async function requireMobileAuth(req: Request) {
  const header = req.headers.get("authorization") || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    const err: any = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  try {
    const payload = await verifyAccessToken(token);
    const memberId = Number(payload.sub);

    if (!Number.isInteger(memberId) || memberId <= 0) {
      const err: any = new Error("UNAUTHORIZED");
      err.status = 401;
      throw err;
    }

    return { memberId };
  } catch {
    const err: any = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}
