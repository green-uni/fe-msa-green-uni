<script setup>
defineProps({
  columns: Array,
  rows: Array,
  gridCols: String,
  isLoading: Boolean, // 데이터 가져오는 중일 때 ( MemberList 참고 )
  className:String,
  emptyMessage: {  // 데이터 없을 때 메시지
    type: String,
    default: ' 조회된 데이터가 없습니다. '
  }
})
</script>

<template>
  <section class="tbl-wrap" :class="className" :style="`--grid-cols: ${gridCols}`">
    <article class="tbl-head">
      <div v-for="col in columns" :key="col">{{ col }}</div>
    </article>
    <template v-if="!isLoading && rows.length > 0"><!-- 로딩중도 아니고 배열이 0도 아닐때 -->
      <slot /><!-- // 데이터가 들어가는 부분 -->
    </template>
    <article v-if="isLoading" class="no-data"> <!-- 데이터를 가져오는 중일 때 -->
      <p>불러오는 중...</p>
    </article>
    <article v-else-if="rows.length === 0" class="no-data"> <!-- 조회된 데이터가 없을 때 -->
      <p>{{ emptyMessage }}</p>
    </article>
  </section>
</template>

<style scoped lang="scss">
.tbl-wrap { width: 100%; display: grid; }
.tbl-head {
  display: grid; grid-template-columns: var(--grid-cols); align-items: center; text-align: center; font-size: .9em;  font-weight: bold; background: #f5f5f5; border-radius: 5px;  margin-bottom: 5px; border: 1px solid $bold-border-color;
  div { padding:7px; }
}
:deep(.tbl-row) {
  display: grid; grid-template-columns: var(--grid-cols); align-items: center; text-align: center;
  background: #fff; border: 1px solid $border-color; border-top-width: 0;
  &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-top-width: 1px; }
  &:last-of-type { border-radius: 0 0 5px 5px; }
  &.pointer:hover { background: $hover-bg-color; }
  div { padding: 10px; line-height: 1.2; position: relative; display: flex; align-items: center; justify-content: center;}
  &.edit-row > div,
  &:has(button, input) > div { padding-top: 7px;padding-bottom: 7px;}
}
.no-data { grid-column: 1 / -1;  text-align: center; color: $font-color-light; padding: 40px 0; background: #fff; border: 1px solid $border-color; border-radius: 5px;}
</style>