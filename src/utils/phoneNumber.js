/*
전화번호 포맷 변환 (입력할 때: 01012345678 -> 보일 때: 010-1234-1234)
사용법
- import { formatTel } from '@/utils/phoneNumber';
- template에 <div>{{ formatTel(item.tel) }}</div> 작성
 */
export const formatTel = (tel) => {
  if (!tel) return '';
  
  // 숫자만 남기기
  const res = tel.toString().replace(/[^0-9]/g, '');
  
  // 1. 서울 지역번호 (02)인 경우
  if (res.startsWith('02')) {
    if (res.length === 9) {
      return res.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (res.length === 10) {
      return res.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  } 
  
  // 2. 그 외 일반 번호 (010, 031, 051 등)
  if (res.length === 10) {
    return res.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (res.length === 11) {
    return res.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  return res;
};