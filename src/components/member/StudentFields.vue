<script setup>
import { onMounted } from 'vue';
import SearchInput from '@/components/util/SearchInput.vue';
import CalendarDate from '@/components/util/CalendarDate.vue';

const props = defineProps({
  student: { type: Object, required: true  },
  majorList: {  type: Array,  default: () => []  },
  statusList: {  type: Array,  default: () => []  }
})

</script>

<template>
  <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr))">

    <div class="input-wrap">
      <div class="input-label">전공</div>
      <div class="input-content">
        <SearchInput
          v-model="props.student.majorName"
          :list="props.majorList"
          placeholder="전공명을 입력하세요"
          @select="(major) => props.student.majorId = major.majorId"
        />
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label"><span>입학연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.student.entryDate" />
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label"><span>졸업연월</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.student.exitDate" />
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label">상태</div>
      <div class="input-content">
        <select v-model="props.student.status">
          <option value="">상태를 선택하세요</option>
          <option
            v-for="s in props.statusList"
            :key="s.code"
            :value="s.code"
          >{{ s.value }}</option>
        </select>
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label">학년</div>
      <div class="input-content">
        <label>
          <input type="number" v-model="props.student.academicYear" placeholder="학년을 숫자로 입력하세요">
        </label>
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label">학기</div>
      <div class="input-content">
        <label>
          <input type="number" v-model="props.student.semester" placeholder="학기를 숫자로 입력하세요">
        </label>
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-label">기타</div>
      <div class="input-content d-flex g10">
        <label>
          <input type="checkbox" v-model="props.student.isTransfer"> 편입생
        </label>
        <label>
          <input type="checkbox" v-model="props.student.isMultiChild"> 다자녀
        </label>
        <label>
          <input type="checkbox" v-model="props.student.isVeteran"> 국가유공자
        </label>
      </div>
    </div>

  </div>
</template>