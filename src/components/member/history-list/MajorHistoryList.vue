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
    <h3 class="section-title">전공 변경 이력</h3>
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
