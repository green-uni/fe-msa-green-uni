<script setup>
import AuthService from '@/services/authService';
import { useAuthStore } from '@/stores/authentication';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { STATUS_LABEL } from '@/utils/constants.js';

const router = useRouter();
const authStore = useAuthStore();

const statusLabel = computed(() => STATUS_LABEL[authStore.role]?.[authStore.status] ?? '')

const doLogOut = async () => {
  try {
    authStore.logOut()
    await router.push('/login')
    await AuthService.logOut()
  } catch(e){
    console.error(e)
  }
}
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <div class="header-title">
        <span class="header-logo">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 9L12 5 2 9l10 4 10-4v6"/>
            <path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4"/>
          </svg>
        </span>
        <p class="header-school">그린대학교 전자출결</p>
      </div>
      <p class="header-user">
        <span>{{ authStore.memberCode }}</span>
        <span v-if="authStore.major">{{ authStore.major }}</span>
        <span>{{ authStore.name }}</span>
        <span class="header-status">{{ statusLabel }}</span>
      </p>
    </div>

    <button class="btn-logout" @click.prevent="doLogOut" aria-label="로그아웃">
      로그아웃
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  </header>
</template>

<style scoped lang="scss">
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px 12px;
  background: var(--default-bg);
  border-bottom: 1px solid var(--line-color);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.header-logo {
  width: 22px;
  height: 22px;
  background: var(--main-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.header-school {
  font-size: 15px;
  font-weight: 600;
  color: var(--font-color);
  margin: 0;
}

.header-user {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0;
  font-size: var(--text-xs);
  color: var(--font-color-light);

  span + span::before {
    content: '·';
    margin: 0 4px;
  }
}

.header-status {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--main-color) !important;

  &::before {
    content: '' !important;
    margin: 0 !important;
  }
  margin-left: 4px;
}

.btn-logout {
  background: none;
  border: 1px solid var(--line-color);
  border-radius: 8px;
  padding: 6px 8px;
  color: var(--font-color-light);
  font-size: var(--text-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;

  &:hover   { color: var(--font-color); border-color: var(--font-color-light); }
  &:active  { opacity: 0.7; }
}
</style>
