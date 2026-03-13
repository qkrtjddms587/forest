// src/lib/gnuboard-sync.ts

import { gnuDb } from "./gnuboard";

interface GnuMemberData {
  loginId: string;
  rawPassword: string;
  name: string;
}

// 🌟 그누보드 회원가입 전용 어댑터 함수
export async function syncMemberToGnuboard({
  loginId,
  rawPassword,
  name,
}: GnuMemberData) {
  try {
    // 그누보드 고유의 쿼리문은 여기서만 처리합니다.
    await gnuDb.query(
      `INSERT INTO g5_member 
      (mb_id, mb_password, mb_name, mb_datetime, mb_level) 
      VALUES (?, PASSWORD(?), ?, NOW(), 2)`, // 예: 기본 레벨 2 지정
      [loginId, rawPassword, name]
    );

    return { success: true };
  } catch (error) {
    console.error("[GNUBOARD_SYNC_ERROR]", error);
    return { success: false, error };
  }
}
