// app/features/shared/hooks/use_admin.ts
import { useEffect, useState } from 'react';
import { getMyInfo } from '../api/user_api';

export function useAdmin() {
  const [admin, setAdmin] = useState({  
    name: '',            // ✅ 실명(한수호)을 받기 위해 필드 추가
    nickname: '', 
    email: '', 
    profileImageUrl: '' 
  });

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    getMyInfo()
      .then(data => {
        // ✅ 백엔드 데이터(name: "한수호")를 상태에 저장합니다.
        setAdmin({
          name: data.name || '',              // DB의 NAME 컬럼 데이터
          nickname: data.nickname || '', 
          email: data.email || '',            // grease@naver.com
          profileImageUrl: data.profileImageUrl || ''
        });
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
      });
  }, []);

  return { admin };
}