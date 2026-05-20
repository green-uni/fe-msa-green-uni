  <script setup>
  import logo from '@/assets/logo.png';
  import { reactive, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthStore } from '@/stores/authentication';
  import { useModalStore } from '@/stores/modal'
  import AuthService from '@/services/authService';
  import MemberService from '@/services/memberService';
  import LoginForm from '@/components/auth/LoginForm.vue';
  import PublicAnnouncement from '@/components/announcement/PublicAnnouncement.vue';

  const authStore = useAuthStore()
  const modal = useModalStore()
  const router = useRouter();

  const state = reactive({
    form: {
      memberCode: '20221001',
      password: '1234'
    },
    role: 'STUDENT'
  })

  watch(() => state.role, (role) => {
    if (role === 'STUDENT') {
      state.form.memberCode = '20221001'
      state.form.password = '1234'
    } else if (role === 'PROFESSOR') {
      state.form.memberCode = '20152001'
      state.form.password = '1234'
    }
  })

  const login = async () => {
    try {
      const res = await AuthService.logIn(state.form);
      const profile = await MemberService.findProfile();
      authStore.logIn(res.data);
      authStore.setProfile(profile.data);

      if (res.data.isFirstLogin) {
        await modal.showAlert('최초 로그인 입니다. 비밀번호를 변경해주세요', 'warning')
        if (res.data.deviceId === 'mobile') {
          router.push('/attend/my/password')
        } else {
          await router.push('/members/my/password')
        }
        return
      }

      // [추가] QR URL 직접 접근 후 로그인한 경우 → 원래 경로(token 포함)로 복귀
      const redirect = sessionStorage.getItem('redirectAfterLogin')
      if (redirect) {
        sessionStorage.removeItem('redirectAfterLogin')
        router.push(redirect)
        return
      }

      // [수정] deviceId(서버 판단) 또는 UA(클라이언트 직접 판단) 둘 중 하나라도 mobile이면 PWA 홈으로 이동
      // deviceId만 쓰면 일부 모바일 브라우저(웹뷰 등)에서 감지 실패하는 경우가 있어 이중 체크
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      if (res.data.role === 'STUDENT' && (res.data.deviceId === 'mobile' || isMobileUA)) {
        router.push('/student/attendances/home')
        return
      }
      router.push('/members/dashboard')

    } catch (e) {
      console.error(e)
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
          <span class="intro-header-sub">너와 나의 꿈을 그린</span>
          <span class="intro-header-name">그린대학교</span>
        </div>
      </header>
      <!-- 로그인 유형 탭 -->
      <nav class="role-tabs" role="tablist">
        <button @click="router.push('/login')" class="tab is-active" role="tab" aria-selected="true">교수 · 학생</button>
        <button @click="router.push('/admin/login')" class="tab" role="tab" aria-selected="false">관리자</button>
      </nav>
    </div>

    <div class="sample-data">
      <div class="input-content radio-group radio-tab">
        <label class="radio-label">
          <input type="radio" name="role" value="STUDENT" v-model="state.role">
          <span>학생</span>
        </label>
        <label class="radio-label">
          <input type="radio" name="role" value="PROFESSOR" v-model="state.role">
          <span>교수</span>
        </label>
      </div>
    </div>
    <LoginForm :form="state.form" variant="academic" @login="login" />
    <PublicAnnouncement />
  </div>
</template>

<style scoped lang="scss">
.intro-box {
  max-width: 500px;
  width: 100%;
  padding: 3em;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
  color: $font-color;

  @media (max-width: 960px) {
    padding: 2em 1.5em;
    gap: 20px;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.intro-header {
  display: flex;
  align-items: center;
  gap: 14px;

  &-logo {
    width: 54px;
    height: 54px;
    object-fit: contain;
  }

  &-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &-sub {
    font-size: .9em;
    color: $green-600;
    font-weight: 600;
    letter-spacing: .04em;
  }

  &-name {
    font-size: 1.8em;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
}

.role-tabs {
  display: inline-flex;
  padding: 4px;
  background: #eee;
  border-radius: 50px;
  width: fit-content;
  gap: 2px;

  .tab {
    padding: 10px 20px;
    font-weight: 600;
    border-radius: 50px;
    transition: all .18s ease;
    border: 1px solid #ddd;
    background: $default-bg;

    &:hover {
      color: $green-600;
    }

    &.is-active {
      color: $green-600;
      border-color: $green-600;
      ;
    }
  }
}
</style>
