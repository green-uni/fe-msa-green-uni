<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import { formatDateTime } from '@/utils/DateNumber'

const props = defineProps({
    role: { type: String },
    list: { type: Array },
    isLoading: {type:Boolean}
})
console.log('변동 내역:', props.list)

//////////////////////////////// 테이블 설정 ////////////////////////////////
const tableColumns = computed(() => {
  switch (props.role) {
    case 'STUDENT':
      return {
        colName: [
          '변경일',
          '변동구분',
          '변경전',
          '변경후',
          '시작일',
          '종료일',
          '복학예정',
          '사유',
        ],
        cols: '120px 180px 100px 80px 80px 100px 100px 1fr',
      }
    case 'PROFESSOR':
      return {
        colName: ['변경일', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
        cols: '120px 180px 100px 80px 80px 100px 1fr',
      }
    default: // ADMIN
      return {
        colName: ['변경일', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
        cols: '120px 180px 100px 80px 80px 100px 1fr',
      }
  }
})
</script>

<template>
  <div class="wrap">
    <h3>
        <template v-if="role == 'STUDENT'">학적변동이력</template>
        <template v-else-if="role == 'PROFESSOR'">직위/상태 변동 이력</template>
        <template v-else>재직 변동 이력</template>
    </h3>
    <DataTable
      :columns="tableColumns.colName"
      :rows="props.list"
      :gridCols="tableColumns.cols"
      :isLoading="props.isLoading"
      emptyMessage="조회된 이력이 없습니다."
    >
      <article class="tbl-row no-hover" v-for="item in props.list" :key="item.createdAt">
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.changeType }}</div>
        <div>{{ item.oldStatus || item.oldPosition }}</div>
        <div>{{ item.newStatus || item.newPosition }}</div>
        <div>{{ item.startDate || '-' }}</div>
        <div>{{ item.endDate || '-' }}</div>
        <div v-if="role == 'STUDENT' && (item.returnYear || item.returnSemester)">{{ item.returnYear }}년 {{ item.returnSemester }} 학기</div>
        <div>{{ item.reason }}</div>
      </article>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.tbl-wrap { width: 100%; display: grid;}

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
