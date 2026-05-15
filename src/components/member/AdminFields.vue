<script setup>
import CalendarDate from '@/components/util/CalendarDate.vue';

const props = defineProps({
  admin: { type: Object, required: true },
  statusList: { type: Array, default: () => [] },
  mode: { type: String, default: 'create' }
})
</script>

<template>
  <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr))">
    <div class="input-wrap" v-if="props.mode === 'create'">
      <div class="input-label"><span>입사연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.admin.entryDate" />
      </div>
    </div>
    <!-- <div class="input-wrap" v-if="props.mode !== 'selfEdit'">
      <div class="input-label"><span>퇴사연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.admin.exitDate" />
      </div>
    </div> -->
    <div class="input-wrap" v-if="props.mode === 'create'">
      <div class="input-label">상태</div>
      <div class="input-content">
        <select v-model="props.admin.status">
          <option value="">상태를 선택하세요</option>
          <option
            v-for="s in props.statusList"
            :key="s.code"
            :value="s.code"
          >{{ s.value }}</option>
        </select>
      </div>
    </div>
  </div>
</template>