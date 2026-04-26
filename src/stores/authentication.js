import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const loginUserId = ref(0)
    const name = ref('') // 이름
    const code = ref('') // 학번/교번/사번
    const role = ref('') // 학생/교수/관리자

    const stdMajor = ref('') // 학생 전공
    const profMajor = ref('') // 교수 전공

    const stdStatus = ref('') // 학생 상태 // 재학 enrolled, 휴학 absence, 졸업 graduation, 퇴학 expulsion, 자퇴 quit
    const stfStatus = ref('') // 관리자 상태 // 재직 employment, 휴직 absence, 퇴사 retirement
    const profStatus = ref('') // 교수 상태 // 재직 employment, 휴직 absence, 퇴임 retirement

    const isLogin = ref(false)

    // 로그인
    const logIn = (loginUser) => {
      loginUserId.value = loginUser.loginUserId
      name.value = loginUser.name
      code.value = loginUser.code
      role.value = loginUser.role

      stdMajor.value = loginUser.stdMajorName
      profMajor.value = loginUser.profMajorName

      stdStatus.value = loginUser.stdStatus
      stfStatus.value = loginUser.stfStatus
      profStatus.value = loginUser.profStatus

      isLogin.value = true
    }

    // 로그아웃
    const logOut = () => {
      loginUserId.value = 0
      name.value = ''
      code.value = ''
      role.value = ''
      stdMajor.value = ''
      profMajor.value = ''
      isLogin.value = false
      stdStatus.value = ''
      stfStatus.value = ''
      profStatus.value = ''
    }

    return { loginUserId, name, code, role,
              stdMajor, profMajor, isLogin, stdStatus, stfStatus, profStatus,
              logIn, logOut }
  },
  { persist: true },
)
