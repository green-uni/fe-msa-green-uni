<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'
import DataTable from '@/components/common/DataTable.vue'

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
          '변경일시',
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
        colName: ['변경일시', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
        cols: '120px 180px 100px 80px 80px 100px 1fr',
      }
    default: // ADMIN
      return {
        colName: ['변경일시', '변동구분', '변경전', '변경후', '시작일', '종료일', '사유'],
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
        <div>{{ item.createdAt }}</div>
        <div>{{ item.changeType }}</div>
        <div>{{ item.oldStatus }}</div>
        <div>{{ item.newStatus }}</div>
        <div>{{ item.startDate || '-' }}</div>
        <div>{{ item.endDate || '-' }}</div>
        <div v-if="role == 'STUDENT' && (item.returnYear || item.returnSemester)">{{ item.returnYear }}년 {{ item.returnSemester }} 학기</div>
        <div>{{ item.reason }}</div>
      </article>
    </DataTable>
  </div>
</template>

<style scoped lang="scss"></style>
