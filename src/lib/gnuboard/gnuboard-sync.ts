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
  // 1. 커넥션 풀에서 단일 커넥션을 가져옵니다.
  const connection = await gnuDb.getConnection();

  try {
    // 🌟 2. 해당 커넥션(세션)에 대해서만 MySQL 엄격 모드(Strict Mode)를 일시 해제합니다.
    // 이렇게 하면 값이 없는 필드에는 MySQL이 알아서 빈 문자열('')이나 '0'을 넣어줍니다.
    await connection.query(`SET SESSION sql_mode = ''`);

    // 3. 일일이 필드를 적을 필요 없이, 꼭 필요한 핵심 데이터만 심플하게 넣습니다.
    await connection.query(
      `INSERT INTO g5_member 
      (mb_id, mb_password, mb_name, mb_nick, mb_datetime, mb_level) 
      VALUES (?, PASSWORD(?), ?, ?, NOW(), 2)`,
      [loginId, rawPassword, name, name],
    );

    return { success: true };
  } catch (error) {
    console.error("[GNUBOARD_SYNC_ERROR]", error);
    return { success: false, error };
  } finally {
    // 4. 작업이 끝나면 커넥션을 다시 풀(Pool)에 반환합니다. (매우 중요)
    connection.release();
  }
}
