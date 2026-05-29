<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  maxPage: { type: Number, default: 1 },
  pageGroupSize: { type: Number, default: 10 },
});

const emit = defineEmits(['goToPage']);

// 현재 페이지가 속한 그룹의 시작/끝 페이지
const groupStart = computed(() => {
  return Math.floor((props.currentPage - 1) / props.pageGroupSize) * props.pageGroupSize + 1;
});
const groupEnd = computed(() => {
  return Math.min(groupStart.value + props.pageGroupSize - 1, props.maxPage);
});

// 현재 그룹의 페이지 번호 배열
const pages = computed(() => {
  const result = [];
  for (let i = groupStart.value; i <= groupEnd.value; i++) result.push(i);
  return result;
});

const hasPrev = computed(() => groupStart.value > 1);
const hasNext = computed(() => groupEnd.value < props.maxPage);

const goTo = (page) => {
  if (page < 1 || page > props.maxPage) return;
  emit('goToPage', page);
};
</script>

<template>
  <div class="pagination" v-if="maxPage > 1">
    <!-- 처음 -->
    <button class="page-btn" :disabled="currentPage === 1" @click="goTo(1)">
      <font-awesome-icon icon="fa-solid fa-angles-left" />
    </button>
    <!-- 이전 그룹 -->
    <button class="page-btn" :disabled="!hasPrev" @click="goTo(groupStart - 1)">
      <font-awesome-icon icon="fa-solid fa-angle-left" />
    </button>

    <!-- 페이지 번호 -->
    <button
      v-for="page in pages"
      :key="page"
      :class="['page-btn', { active: page === currentPage }]"
      @click="goTo(page)"
    >
      {{ page }}
    </button>

    <!-- 다음 그룹 -->
    <button class="page-btn" :disabled="!hasNext" @click="goTo(groupEnd + 1)">
      <font-awesome-icon icon="fa-solid fa-angle-right" />
    </button>
    <!-- 마지막 -->
    <button class="page-btn" :disabled="currentPage === maxPage" @click="goTo(maxPage)">
      <font-awesome-icon icon="fa-solid fa-angles-right" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.pagination { display: flex; justify-content: center; align-items: center; gap: 4px; margin-top: 20px;}
.page-btn { min-width: 27px; height: 27px; padding: 0 5px; border: 1px solid $border-color; font-size: 0.9em; border-radius: 4px; background: #fff; color: $font-color-light; cursor: pointer;  transition: all 0.2s;
  &:hover:not(:disabled):not(.active) { background: $default-hover-bg-color; color: $font-color; }
  &.active {  background: $green-600;  color: #fff;  border-color: $green-600;  font-weight: 700;}
  &:disabled { color: #ccc; cursor: default; border-color: #eee; }
}
</style>