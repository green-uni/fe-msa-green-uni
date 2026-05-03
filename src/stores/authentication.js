import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore(
  'loginMember',
  () => {
    const memberCode = ref(0)
    const role = ref('')
    const deviceId = ref('')
    const isFirstLogin = ref(false)
    const isLogin = ref(false)

    // 로그인
    const logIn = (data) => {
      memberCode.value = data.memberCode;
      role.value = data.role;
      isFirstLogin.value = data.isFirstLogin;
      isLogin.value = true;
    }

    // 로그아웃
    const logOut = () => {
      memberCode.value = 0
      role.value = '';
      isFirstLogin.value = false
      isLogin.value = false;
     }

    return { memberCode, role, isFirstLogin, isLogin, logIn, logOut }
  },
  { persist: true },
)
