<script setup>
import logo from '@/assets/logo.png';
  import AuthService from '@/services/authService';
import { useAuthStore } from '@/stores/authentication';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const doLogOut = async () => {
  try {
    await AuthService.logOut();
    authStore.logOut();
    router.push('/')
  } catch(e){
    console.error(e)
  }
}

let userRole = '';
if( authStore.role == 'admin'){ userRole = '관리자' }
else if( authStore.role == 'professor' ){ userRole = '교수'}
else { userRole = '학생' }

</script>

<template>
  <div class="d-flex ai-center jc-space-b">
    <div class="uni-title d-flex ai-center pointer" @click="router.push('/member/me')">
      <img :src="logo" @click="moveToMain" />
      <h1>그린대학교 학사관리 시스템</h1>
      <p>university resource planning</p>
    </div>
    <div class="user-box d-flex ai-center">
      <div class="user-info">
        <p class="user-name">{{ authStore.name }}님 반갑습니다</p>
        <p>
          <span>{{ authStore.code }}</span>
          <span v-if="authStore.role == 'student' || authStore.role == 'professor'">{{ authStore.stdMajor || authStore.profMajor }}</span>
          <span>{{ userRole }}</span>
        </p>
      </div>
      <a @click.prevent="doLogOut" class="pointer"><font-awesome-icon icon="fa-solid fa-right-from-bracket" /> 로그아웃</a>
    </div>
  </div>
</template>

<style scoped>
.uni-title{gap: 10px;font-size:var(--text-md);}
.uni-title h1{font-weight: 500;}
.uni-title p{opacity: .3;text-transform: uppercase; font-size: .9em;}

.user-box{gap: 20px;}
.user-box .user-info{padding: 13px 30px;background: var(--default-bg);border-radius: 50px;line-height: 1;display: flex;flex-direction: column;gap: 2px;}
.user-box .user-info .user-name{font-weight: 600;}
.user-box .user-info span{font-size: .8rem;opacity: .5;position: relative;}
.user-box .user-info span:nth-of-type(2){margin-left: 5px;padding: 5px;}
.user-box .user-info span:nth-of-type(2):before{content:'·';left: -2px; top: 50%; transform: translateY(-50%);position: absolute;}
.user-box a{font-size: .9rem;opacity: .5;font-weight: 500;}
.user-box a:hover{opacity: 1;}
</style>
