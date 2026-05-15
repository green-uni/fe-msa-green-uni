<script setup>
import logo from '@/assets/logo.png';
import AuthService from '@/services/authService';
import { useAuthStore } from '@/stores/authentication';
import { useRouter,useRoute } from 'vue-router';
import { STATUS_LABEL } from '@/utils/constants.js'

// [수정] URL 경로 대신 부모 레이아웃이 prop으로 모바일 여부를 전달
// AttendanceLayout → :mobile="true", AcademicLayout/AdminLayout → 기본값 false
const props = defineProps({ mobile: { type: Boolean, default: false } })

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const role = authStore.role
const isAdmin = route.path.startsWith('/admin');
const isMobile = props.mobile;

const doLogOut = async () => {
  try {
    await AuthService.logOut();
    authStore.logOut();
    // [수정] '/' 대신 '/login'으로 직접 이동
    // '/'는 publicPages에 없어 router guard가 redirectAfterLogin='/'를 저장 →
    // 재로그인 시 모바일 학생도 AcademicLayout으로 리다이렉트되는 버그 수정
    router.push('/login')
  } catch(e){
    console.error(e)
  }
}

let userRole = '';
if( authStore.role == 'ADMIN'){ userRole = '관리자' }
else if( authStore.role == 'PROFESSOR' ){ userRole = '교수'}
else { userRole = '학생' }

</script>

<template>
  <div class="top-header">
    <div v-if="!isMobile" class="uni-title" @click="router.push('/member/my')">
      <img :src="logo" @click="moveToMain" />
      <h1>그린대학교 {{ isAdmin? '학사 관리 시스템' : '종합 정보 시스템' }}</h1>
    </div>
    <div v-if="isMobile">
      <h1>그린대학교 전자출결 시스템</h1>
    </div>
    <div class="user-box">
      <div class="user-info" v-if="!isMobile">
        <p>
          <span>{{ authStore.memberCode }}</span>
          <span>{{ authStore.major }}</span>
          <span>{{ authStore.name }}</span>
          <!-- [수정] role이 빈 문자열일 때 TypeError 방지 — optional chaining 적용 -->
        <span>{{ STATUS_LABEL[role]?.[authStore.status] ?? '' }}</span>
          <span>{{ userRole }}</span>
        </p>
      </div>
      <a @click.prevent="doLogOut" class="pointer"><font-awesome-icon icon="fa-solid fa-right-from-bracket" /> 로그아웃</a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top-header{grid-column: 1 / -1;padding:0 var(--size-df);align-items: center;justify-content: space-between; display: flex; background: #333;color: #fff;}
.uni-title{
  display: flex; align-items:center; cursor: pointer; gap: 10px;font-size:var(--text-md);
  img{height: 30px;}
  h1{font-weight: normal;}
  p{opacity: .3;text-transform: uppercase; font-size: .9em;}
}
.user-box{
  display: flex; align-items:center;gap: 20px;
  .user-info{
    padding: 13px 30px;background: var(--default-bg);border-radius: 50px;line-height: 1;display: flex;flex-direction: column;gap: 2px;
    .user-name{font-weight: 600;}
    span{
      font-size: .8rem;opacity: .5;position: relative;color:#333;
      &:nth-of-type(2){
        margin-left: 5px;padding: 5px;
        &::before{content:'·';left: -2px; top: 50%; transform: translateY(-50%);position: absolute;}
      }
    }
  }
  a{
    font-size: .9rem;opacity: .5;font-weight: 500;
    &:hover{opacity: 1;}
  }
}
</style>
