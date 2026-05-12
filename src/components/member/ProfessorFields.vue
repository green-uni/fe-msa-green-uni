<script setup>
import SearchInput from '@/components/util/SearchInput.vue';
import CalendarDate from '@/components/util/CalendarDate.vue';

const props = defineProps({
  professor: { type: Object, required: true },
  majorList: { type: Array, default: () => [] },
  statusList: { type: Array, default: () => [] },
  positionList: { type: Array, default: () => [] },
  degreeList: { type: Array, default: () => [] },
  buildingList: { type: Array, default: () => [] },
  mode: { type: String, default: 'create' }
})
</script>

<template>
  <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr))">

    <div class="input-wrap" v-if="props.mode !== 'selfEdit'">
      <div class="input-label">전공</div>
      <div class="input-content">
        <SearchInput
          v-model="props.professor.majorName"
          :list="props.majorList"
          placeholder="전공명을 입력하세요"
          @select="(major) => props.professor.majorId = major.majorId"
        />
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode === 'create'">
      <div class="input-label"><span>입사연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.professor.entryDate" />
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode !== 'selfEdit'">
      <div class="input-label"><span>퇴임연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.professor.exitDate" />
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode === 'create'">
      <div class="input-label">상태</div>
      <div class="input-content">
        <select v-model="props.professor.status">
          <option value="">상태를 선택하세요</option>
          <option
            v-for="s in props.statusList"
            :key="s.code"
            :value="s.code"
          >{{ s.value }}</option>
        </select>
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode !== 'selfEdit'">
      <div class="input-label">학위</div>
      <div class="input-content">
        <select v-model="props.professor.degree">
            <option value="">학위를 선택해주세요</option>
            <option v-for="s in props.degreeList" :key="s.code" :value="s.code">{{ s.value }}</option>
        </select>
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode === 'create'">
      <div class="input-label">직위</div>
      <div class="input-content">
        <select v-model="props.professor.position">
          <option value="">직위를 선택해주세요</option>
          <option v-for="s in props.positionList" :key="s.code" :value="s.code">{{ s.value }}</option>
        </select>
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode !== 'adminEdit'">
      <div class="input-label">연구실</div>
      <div class="input-content two-input">
        <select v-model="props.professor.labBuilding">
          <option v-for="s in props.buildingList" :key="s.code" :value="s.code">{{ s.value }}</option>
        </select>
        <input type="text" v-model="props.professor.labRoom" placeholder="연구실 호실 입력">
      </div>
    </div>

    <div class="input-wrap" v-if="props.mode !== 'adminEdit'">
      <div class="input-label">연구실<br>전화번호</div>
      <div class="input-content">
        <label>
          <input type="text" v-model="props.professor.labTel" placeholder="연구실 전화번호를 입력해주세요">
        </label>
      </div>
    </div>

  </div>
</template>
