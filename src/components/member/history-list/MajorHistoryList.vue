<script setup>
import { computed } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import { formatDateTime } from '@/utils/dateNumber'
import { MAJOR_REQUEST_TYPE } from '@/utils/constants';

const props = defineProps({
    adminView: { type: Boolean, default: false },
    list: { type: Array, default: () => [] },
    isLoading: { type: Boolean }
})

const changeTypeLabel = (item) => {
  if (item.type === 'MINOR') return item.beforeName ? '부전공 변경' : '부전공 취득'
  return MAJOR_REQUEST_TYPE[item.type] ?? item.type
}

//////////////////////////////// 테이블 설정 ////////////////////////////////
const tableColumns = computed(() => {
  if (props.adminView) {
    return {
      colName: ['변경일', '변경 시기', '변동구분', '변경전', '변경후', '처리자'],
      cols: '110px 120px 80px 1fr 1fr 120px',
    }
  }
  return {
    colName: ['변경일', '변경 시기', '변동구분', '변경전', '변경후'],
    cols: '110px 120px 80px 1fr 1fr',
  }
})
</script>

<template>
  <div class="wrap">
    <h3>전공 변경 이력</h3>
    <DataTable
      :columns="tableColumns.colName"
      :rows="props.list"
      :gridCols="tableColumns.cols"
      :isLoading="props.isLoading"
      emptyMessage="조회된 이력이 없습니다."
    >
      <article class="tbl-row no-hover" v-for="item in props.list" :key="item.updatedAt + item.type">
        <div>{{ formatDateTime(item.updatedAt) }}</div>
        <div>{{ item.academicYear }}학년 {{ item.semester }}학기</div>
        <div>{{ changeTypeLabel(item) }}</div>
        <div>{{ item.beforeName || '-' }}</div>
        <div>{{ item.afterName || '-' }}</div>
        <div v-if="adminView">{{ item.updaterName || '-' }}</div>
      </article>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.tbl-wrap { min-width: 800px;width: 100%; display: grid;}

.tbl-head, .tbl-row { display: grid; grid-template-columns: var(--grid-cols); align-items: center; text-align: center;}

.tbl-head {
  font-size: var(--text-sm); font-weight: bold;  background: #f5f5f5;border-radius: 5px;margin-bottom: 5px;  border: 1px solid var(--table-border-color);
  div {  padding: 10px;}
}
.tbl-row {
  background: #fff;  border: 1px solid var(--table-border-color);border-top-width: 0;
  &:nth-of-type(2){ border-radius: 5px 5px 0 0;  border-width: 1px;}
  &:last-child{ border-radius: 0 0 5px 5px; }
  &:not(.no-hover):hover {  background: var(--hover-bg-color);  z-index: 2;  color: #111;} /*class명에 'tbl-row no-hover' 이렇게 no-hover가 붙으면 hover 효과 없음 */
  div {  padding: 12px 10px;  line-height: 1.2;  position: relative;}
 .no-data { text-align: center;  color: #aaa;  padding: 40px 0;  background: #fff;  border-radius: var(--bdrs-sm);} /* 빈 row */
}
.row-disabled div {  color: #ddd;} /* 비활성 row */

.input-content{
  padding: 0;width: 100%;
  select{padding: 2px 5px;width:70px;}
}
</style>
