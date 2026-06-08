<script setup>
import logo from '@/assets/logo.png';
import AuthService from '@/services/authService';
import MemberService from '@/services/memberService';
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/authentication';
import { useRouter } from 'vue-router';
import { useModalStore } from '@/stores/modal'
import LoginForm from '@/components/auth/LoginForm.vue';
import PublicAnnouncement from '@/components/announcement/PublicAnnouncement.vue';

const authStore = useAuthStore()
const router = useRouter();
const modal = useModalStore()
const isLoading = ref(false)

const state = reactive({
  form: {
    memberCode: '',
    password: ''
  },
  role: ''
})

const login = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const res = await AuthService.adminLogIn(state.form);
    const profile = await MemberService.findProfile();

    if (res.data.isFirstLogin) {
      await modal.showAlert('최초 로그인 입니다. 비밀번호를 변경해주세요', 'warning')
      authStore.logIn(res.data);
      authStore.setProfile(profile.data);
      router.push('/admin/members/my/password')
      return
    }

    authStore.logIn(res.data);
    authStore.setProfile(profile.data);
    router.push('/admin/members/dashboard')
  } catch (e) {
    console.error(e)
    isLoading.value = false
  }
}
</script>

<template>
  <!-- 오른쪽 로그인 + 공지사항 -->
  <div class="intro-box">
    <div class="top">
      <header class="intro-header">
        <img :src="logo" alt="그린대학교" class="intro-header-logo" />
        <div class="intro-header-text">
          <span class="intro-header-sub">ADMINISTRATOR</span>
          <span class="intro-header-name">그린대학교</span>
        </div>
      </header>
      <!-- 로그인 유형 탭 -->
      <nav class="role-tabs" role="tablist">
        <button @click="router.push('/login')" class="tab pointer" role="tab" aria-selected="false">교수 · 학생</button>
        <button @click="router.push('/admin/login')" class="tab is-active pointer" role="tab" aria-selected="true">관리자</button>
      </nav>
    </div>
    <LoginForm :form="state.form" variant="admin" :isLoading="isLoading" @login="login" />
    <PublicAnnouncement />
  </div>
</template>

<style scoped lang="scss">
.intro-box { color: $admin-font-color; }
</style>
