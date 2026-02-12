// app/features/shared/hooks/use_admin.ts
import { useEffect, useState } from 'react';
import { getMyInfo } from '../api/user_api';

export function useAdmin() {
  const [admin, setAdmin] = useState({ nickname: '', email: '', profileImageUrl: '' });

  useEffect(() => {
    getMyInfo()
      .then(data => {
        // 💡 백엔드 UserResponseDto 필드명 매칭
        setAdmin({
          nickname: data.nickname,      // "신동엽"
          email: data.email,            // "bright_8954@naver.com"
          profileImageUrl: data.profileImageUrl
        });
      })
      .catch(err => console.error("데이터 로드 실패:", err));
  }, []);

  return { admin };
}