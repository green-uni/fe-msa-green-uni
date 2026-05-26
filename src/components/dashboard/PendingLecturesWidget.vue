<script setup>
import { ref, onMounted } from 'vue';
import lectureService from '@/services/lectureService';

const lectures = ref([]);
const totalCount = ref(0);

// API 호출 함수
const fetchPendingLectures = async () => {
  try {
    // 1. 대시보드용 파라미터 세팅 (3건 제한, 1페이지, 대기 상태)
    const params = {
      status: 'PENDING',
      size: 3,
      startIdx: 0
    };

    // 2. 관리자용 강의 목록 API 호출
    const response = await lectureService.getAdminLectures(params);
    
    if (response) {
      lectures.value = response.data || [];
      totalCount.value = response.data?.[0]?.totalCount ?? 0;
    }
  } catch (error) {
    console.error("대시보드 강의 승인 대기 목록 로드 실패:", error);
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
      <RouterLink 
        :to="{ path: '/admin/lectures/my', query: { status: 'PENDING', page: 1 } }" 
        class="view-all"
      >
        전체보기
      </RouterLink>
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

<style scoped>
.widget-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 20px;
  width: 100%;
  max-width: 320px; /* 대시보드 레이아웃 구조에 따라 유연하게 조절 가능 */
  box-sizing: border-box;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.widget-header h3 {
  font-size: 18px;
  font-weight: bold;
  color: #1e293b;
  margin: 0;
}

.widget-header .count {
  color: #1e293b;
}

.view-all {
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.lecture-item {
  margin-bottom: 15px;
}

.lecture-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 6px 0;
}

.lecture-info {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 15px 0;
}

.divider {
  border: 0;
  border-top: 1px solid #cbd5e1;
  margin: 0;
}

.empty-msg {
  text-align: center;
  color: #94a3b8;
  padding: 20px 0;
  font-size: 14px;
}
</style>