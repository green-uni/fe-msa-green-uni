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

    // 로그인
    const logIn = (data) => {
      memberCode.value = data.memberCode;
      role.value = data.role;
      deviceId.value = data.deviceId;
      name.value = data.name;
      major.value = data.major;
      isFirstLogin.value = data.isFirstLogin;
      isLogin.value = true;
    }

    const setProfile = (data) => {
      name.value = data.name
      if (data.role === '학생') {
        major.value = data.mainMajorName
      } else if (data.role === '교수') {
        major.value = data.majorName
      }
    }

    // 로그아웃
    const logOut = () => {
      memberCode.value = 0
      role.value = '';
      isFirstLogin.value = false
      isLogin.value = false;
     }

    return { memberCode, role, name, major, deviceId, isFirstLogin, setProfile, isLogin, logIn, logOut }
  },
  { persist: true },
)
