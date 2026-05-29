<script setup>
import { computed } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import { formatDateTime } from '@/utils/dateNumber'

const props = defineProps({
    role: { type: String },
    list: { type: Array, default: () => [] },
    isLoading: {type:Boolean}
})

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
        cols: '110px 80px 60px 60px 110px 110px 100px 1fr',
      }
    case 'PROFESSOR':
      return {
        colName: ['변경일', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
        cols: '110px 100px 80px 80px 110px 110px 1fr',
      }
    default: // ADMIN
      return {
        colName: ['변경일', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
        cols: '110px 180px 100px 80px 110px 110px 1fr',
      }
  }
})
</script>

<template>
  <div class="wrap">
    <h3 class="section-title">
      <template v-if="role == 'STUDENT'">학적 변동 이력</template>
      <template v-else-if="role == 'PROFESSOR'">직위 / 상태 변동 이력</template>
      <template v-else>재직 변동 이력</template>
    </h3>
    <DataTable
      :columns="tableColumns.colName"
      :rows="props.list"
      :gridCols="tableColumns.cols"
      :isLoading="props.isLoading"
      emptyMessage="조회된 이력이 없습니다."
    >
      <article class="tbl-row no-hover" v-for="item in props.list" :key="item.createdAt + item.changeType">
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.changeType }}</div>
        <div>{{ item.oldStatus || item.oldPosition }}</div>
        <div>{{ item.newStatus || item.newPosition }}</div>
        <div>{{ item.startDate || '-' }}</div>
        <div>{{ item.endDate || '-' }}</div>
        <div v-if="role == 'STUDENT'">
          <template v-if="role == 'STUDENT' && (item.returnYear || item.returnSemester)">{{ item.returnYear }}-{{ item.returnSemester }}학기</template>
          <template v-else>-</template>
        </div>
        <div>{{ item.reason || '-' }}</div>
      </article>
    </DataTable>
  </div>
</template>
