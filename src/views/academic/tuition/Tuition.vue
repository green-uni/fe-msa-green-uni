<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import tuitionService from '@/services/tuitionService';

const router = useRouter();
const isLoading = ref(true);
const tuitionDetail = ref(null);
const currentTuitionId = ref(null);

const fetchTuitionDetail = async () => {
  try {
    isLoading.value = true;
    console.log('--- 등록금 데이터 로딩 시작 ---');
    
    // 1. API-TUI-01: 학생 내역 전체 목록 조회 호출하여 최신 고지서 찾기
    const listResponse = await tuitionService.getMyTuitionList();
    console.log('백엔드 목록 응답 데이터:', listResponse);
    
    const listData = listResponse?.data;

    if (listData && listData.length > 0) {
      // 가장 최근 학기의 고지서 ID를 추출합니다.
      const targetTuitionId = listData[0].tuitionId; 
      currentTuitionId.value = targetTuitionId;
      
      console.log(`최신 고지서 ID 확인 (${targetTuitionId}) -> 장학금 정산을 위해 상세 조회 API 호출`);

      // 2. 🎯 [핵심 수정] 정밀 매싱된 getMyTuitionDetail 호출
      // 백엔드의 getStudentTuitionDetailByTuitionId 로직을 트리거하여 장학금을 계산합니다.
      const detailResponse = await tuitionService.getMyTuitionDetail(targetTuitionId);
      console.log('백엔드 상세 응답 데이터(장학금 반영됨):', detailResponse);

      // 상세 조회 결과를 화면 데이터에 바인딩
      tuitionDetail.value = detailResponse?.data;
    } else {
      throw new Error('조회된 등록금 고지 내역이 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('등록금 정보 호출 최종 실패:', error);
    alert('현재 조회 가능한 등록금 고지 내역 정보가 없습니다.');
    
    // 🎯 프로젝트에 존재하지 않던 '/main' 대신 안전하게 루트 경로('/')로 리다이렉트합니다.
    router.push('/'); 
  } finally {
    isLoading.value = false;
  }
};

const handlePayment = async () => {
  if (!currentTuitionId.value) {
    alert('처리할 고지서 정보가 유효하지 않습니다.');
    return;
  }

  if (!confirm('가상계좌 입금 후 확인 요청 처리를 진행하시겠습니까?')) return;
  
  try {
    // API-TUI-07: 납부 신청 진행 (상태를 PENDING으로 변경 요청)
    await tuitionService.requestPayment(currentTuitionId.value);
    alert('등록금 납부 확인 과정 요청이 완료되었습니다.');
    
    // 💡 중요: 납부 신청 성공 직후 백엔드 데이터를 다시 가져와 화면을 '확인중' 상태로 새로고침합니다.
    await fetchTuitionDetail();
  } catch (error) {
    console.error('납부 신청 처리 실패:', error);
    alert('처리에 실패했습니다. 다시 시도해 주세요.');
  }
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') return '0';
  return Number(value).toLocaleString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
};

onMounted(() => {
  console.log('Tuition 컴포넌트 마운트 완료 -> 데이터 fetch 시작');
  fetchTuitionDetail();
});
</script>

<template>
  <div class="container">
    <div class="data-header">
      <h2 class="page-title"><span class="title-icon">►</span>등록금 상세 조회</h2>
      <div class="breadcrumb">등록금 &gt; 등록금 상세 조회</div>
    </div>

    <div v-if="isLoading" class="state-message-box">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="tuitionDetail">
      
      <div v-if="tuitionDetail.status === '미납' || tuitionDetail.status === 'UNPAID'" class="bill-section">
        <h3 class="bill-title">{{ tuitionDetail.year }}년 {{ tuitionDetail.semester }}학기 등록금 상세</h3>
        
        <div class="bill-table">
          <div class="bill-thead">
            <div>기본 등록금</div>
            <div>장학금 감면</div>
            <div>최종 납부금액</div>
            <div>납부 기한</div>
            <div>납부 상태</div>
          </div>
          <div class="bill-tbody">
            <div>{{ formatCurrency(tuitionDetail.baseAmount) }}원</div>
            <div>{{ formatCurrency(tuitionDetail.totalDiscount) }}원</div>
            <div class="font-bold">{{ formatCurrency(tuitionDetail.finalAmount) }}원</div>
            <div>{{ formatDate(tuitionDetail.deadline) }}</div>
            <div class="status-unpaid">미납</div>
          </div>
        </div>

        <div class="account-info">
          <p class="account-title">학교 대표계좌</p>
          <ul>
            <li>신한은행 110-123-456789</li>
            <li>국민은행 6161-0104-290252</li>
            <li>우리은행 100-262-234710</li>
            <li class="depositor">예금주: 그린대학교</li>
          </ul>
        </div>

        <div class="action-wrap">
          <button class="btn-submit-pay" @click="handlePayment">납부완료</button>
        </div>

        <p class="warning-text">
          <span class="emoji">⚠️</span> 납부기한까지 납부하지 않으면 등록이 취소될 수 있습니다.
        </p>
      </div>

      <div v-else-if="tuitionDetail.status === '처리중' || tuitionDetail.status === 'PENDING'" class="state-message-box info-box">
        <p class="msg-pending">
          <span class="warning-icon">⚠️</span> 등록금 납부 확인 과정 중에 있습니다.
        </p>
      </div>

      <div v-else-if="tuitionDetail.status === '납부완료' || tuitionDetail.status === 'PAID'" class="state-message-box info-box">
        <p class="msg-paid">
          <span class="check-icon">✅</span> 등록금을 이미 납부하였습니다.
        </p>
      </div>

    </div>
    
    <div v-else class="state-message-box">
      <p>조회된 등록금 데이터가 없습니다.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-title {
  font-size: var(--text-xl);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  .title-icon { color: var(--main-color); font-size: 0.8em; }
}
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.bill-section { max-width: 900px; margin: 0 auto; }
.bill-title { text-align: center; font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 30px; }

.bill-table {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 25px;

  .bill-thead, .bill-tbody {
    display: grid;
    grid-template-columns: 1.2fr 1.2fr 1.2fr 1.2fr 1fr;
    text-align: center;
    align-items: center;
    div { padding: 12px 10px; font-size: 15px; }
  }

  .bill-thead {
    background-color: #2d6a4f;
    color: #ffffff;
    font-weight: bold;
    border-bottom: 1px solid #cbd5e1;
  }

  .bill-tbody {
    background-color: #ffffff;
    color: #333;
    div { border-right: 1px solid #e2e8f0; &:last-child { border-right: none; } }
    .status-unpaid { color: #e11d48; font-weight: 600; }
    .font-bold { font-weight: bold; color: #1e293b; }
  }
}

.account-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
  margin-bottom: 35px;
  color: #4a5568;
  font-size: 14px;
  
  .account-title { font-weight: bold; margin-bottom: 5px; font-size: 15px; color: #2d3748; }
  ul { list-style: none; text-align: right; padding: 0; margin: 0; }
  li { margin-bottom: 4px; &::before { content: "• "; color: #718096; } }
  .depositor { font-weight: 500; margin-top: 2px; &::before { content: ""; } }
}

.action-wrap { display: flex; justify-content: center; margin-bottom: 35px; }
.btn-submit-pay {
  background-color: #2d6a4f;
  color: white;
  border: none;
  padding: 12px 36px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background-color: #1b4332; }
}

.warning-text { text-align: center; font-size: 14px; color: #4a5568; font-weight: 500; }

// 알림 메시지 영역 통합 스타일 스타일 수정
.state-message-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  border-radius: 8px;
  
  p { font-size: 18px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
  
  // 가이드 기획서 디자인에 맞춘 레이아웃 구성
  &.info-box {
    border: none;
    max-width: 900px;
    margin: 40px auto;
  }
  
  .msg-pending { color: #1f2937; .warning-icon { color: #d97706; } }
  .msg-paid { color: #15803d; .check-icon { color: #16a34a; } }
}
</style>