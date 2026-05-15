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
    const name = ref('')
    const major = ref('')
    const status = ref('')

    // 로그인
    const logIn = (data) => {
      memberCode.value = data.memberCode;
      role.value = data.role;
      deviceId.value = data.deviceId;
      isFirstLogin.value = data.isFirstLogin;
      isLogin.value = true;
    }

    const setProfile = (data) => {
      name.value = data.name;
      status.value = data.status;
      if (data.role === 'STUDENT') {
        major.value = data.mainMajorName
      } else if (data.role === 'PROFESSOR') {
        major.value = data.majorName
      }
    }
    const setFirstLogin = () => {
      isFirstLogin.value = false;
    }

    // 로그아웃
    const logOut = () => {
      memberCode.value = 0
      role.value = '';
      deviceId.value = '',
      isFirstLogin.value = false
      isLogin.value = false;
      name.value = '',
      major.value = '',
      status.value = ''
    }

    return { memberCode, role, name, major, deviceId, isFirstLogin, status, setProfile, setFirstLogin, isLogin, logIn, logOut }
  },
  { persist: true },
)
