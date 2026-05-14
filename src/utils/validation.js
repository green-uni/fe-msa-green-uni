// 이메일 형식 검증
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

// 멤버코드 형식 검증 (8자리 숫자, 5번째 자리 1/2/3)
export const isValidMemberCode = (code) => {
  const regex = /^\d{4}[123]\d{3}$/
  return regex.test(String(code))
}

// 일반 사용자 코드 검증 (학생 1, 교수 2)
export const isUserCode = (code) => {
  return isValidMemberCode(code) && ['1', '2'].includes(String(code)[4])
}

// 관리자 코드 검증
export const isAdminCode = (code) => {
  return isValidMemberCode(code) && String(code)[4] === '3'
}