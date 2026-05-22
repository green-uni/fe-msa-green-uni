<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const lectures = ref([]);
const totalCount = ref(0); // 전체 건수를 저장할 반응형 변수

const fetchPendingLectures = async () => {
  try {
    const response = await axios.get('/api/admin/dashboard/pending-lectures');
    
    // 백엔드에서 가공해준 데이터를 각각 대입
    lectures.value = response.data.lectures;     // 최대 3개 데이터
    totalCount.value = response.data.totalCount; // 전체 카운트 데이터
  } catch (error) {
    console.error("강의 승인 대기 목록 로드 실패:", error);
  }
};

onMounted(() => {
  fetchPendingLectures();
});
</script>

<template>
  <div class="widget-card">
    <div class="widget-header">
      <h3>강의 승인 대기 <span class="count">({{ totalCount }}건)</span></h3>
      <RouterLink to="/admin/approval/lectures" class="view-all">전체보기</RouterLink>
    </div>

    <div class="widget-body">
      <div 
        v-for="(lecture, index) in lectures" 
        :key="lecture.lectureId" 
        class="lecture-item"
      >
        <h4 class="lecture-title">{{ lecture.lectureName }}</h4>
        <p class="lecture-info">{{ lecture.proName }} 교수 · {{ lecture.majorName }}</p>
        
        <hr v-if="index < lectures.length - 1" class="divider" />
      </div>
      
      <div v-if="lectures.length === 0" class="empty-msg">
        승인 대기 중인 강의가 없습니다.
      </div>
    </div>
  </div>
</template>