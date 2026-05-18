<script setup>
import logo from '@/assets/logo.png';
import { useAuthStore } from '@/stores/authentication';
import { useRouter,useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isAdmin = route.path.startsWith('/admin');
const isMobile = route.path.startsWith('/attend');

</script>

<template>
  <div class="top-header" :class="isAdmin ? 'admin' : 'academic'">
    <div v-if="!isMobile" class="uni-title" @click="router.push(isAdmin? '/admin/members/dashboard' : '/members/dashboard')">
      <img :src="logo" @click="moveToMain" />
      <h1>그린대학교 {{ isAdmin? '학사 관리 시스템' : '종합 정보 시스템' }}</h1>
    </div>
    <div v-if="isMobile">
      <h1>그린대학교 전자출결 시스템</h1>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top-header{grid-column: 1 / -1; padding:0 10px;align-items: center;justify-content: space-between; display: flex; background: $admin-default-bg2;color: #fff;}
.uni-title{
  display: flex; align-items:center; cursor: pointer; gap:5px;
  img{height: 25px;}
  h1{font-weight: normal;}
  p{opacity: .3;text-transform: uppercase; font-size: .9em;}
}
</style>
