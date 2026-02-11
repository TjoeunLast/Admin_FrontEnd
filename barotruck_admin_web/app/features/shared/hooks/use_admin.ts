// features/user/hooks/use_admin.ts
import { useEffect, useState } from 'react';
import { getAdminProfile } from '../api/user_api';

export function useAdmin() {
  const [admin, setAdmin] = useState({
    nickname: '최고관리자',
    email: 'admin@barotruck.com'
  });

  useEffect(() => {
    getAdminProfile()
      .then(data => {
        setAdmin({
          nickname: data.NICKNAME, // DB의 NICKNAME 연동
          email: data.EMAIL        // DB의 EMAIL 연동
        });
      })
      .catch(err => console.error("관리자 정보 로드 실패:", err));
  }, []);

  return { admin };
}