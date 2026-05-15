<script setup>
defineProps({
  overlay: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md'  // 'sm' | 'md' | 'lg'
  },
  message: {
    type: String,
    default: '불러오는 중...'
  }
})
</script>

<template>
  <!-- 오버레이 모드: 부모 요소 전체를 덮음. 부모에 position: relative 필요 -->
  <div v-if="overlay" class="loading-overlay">
    <div class="loading-inner">
      <div class="spinner" :class="size"></div>
      <p v-if="message" class="loading-message">{{ message }}</p>
    </div>
  </div>

  <!-- 인라인 모드: 해당 자리에 그냥 표시 -->
  <div v-else class="loading-inline">
    <div class="spinner" :class="size"></div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<style scoped lang="scss">
/* 오버레이: 부모 기준으로 전체를 덮음 */
.loading-overlay {
  position: absolute;
  inset: 0;               /* top/right/bottom/left 전부 0 = 부모 꽉 채움 */
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: inherit; /* 부모 border-radius 그대로 따라감 */
}

/* 인라인: 해당 영역 안에서 중앙 정렬 */
.loading-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  gap: 0.75rem;
  width: 100%;
}

/* 공통: 스피너 원형 */
.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: var(--line-color);           /* 기본 테두리: 연한 회색 */
  border-top-color: var(--main-color);       /* 돌아가는 부분: 메인 컬러 */
  animation: spin 0.7s linear infinite;

  &.sm { width: 20px; height: 20px; border-width: 2px; }
  &.md { width: 32px; height: 32px; border-width: 3px; }
  &.lg { width: 48px; height: 48px; border-width: 4px; }
}

.loading-message {
  font-size: var(--text-sm);
  color: var(--font-color-light);
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
