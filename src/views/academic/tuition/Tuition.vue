<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import tuitionService from '@/services/tuitionService';
import axios from '@/services/httpRequester'; // 서비스 레이어 공통 인스턴스 사용

const route = useRoute();
const router = useRouter();
const isLoading = ref(true);
const tuitionDetail = ref(null);
const currentTuitionId = ref(null);

// 기간 내부인지 여부를 관리하는 변수
const isPeriod = ref(true);

const fetchTuitionDetail = async () => {
  try {
    isLoading.value = true;
    console.log('--- [시작] 데이터 동적 로딩 및 순서 보정 ---');

    // 🎯 1. [순서 보정 및 방어] 백엔드 경로 충돌을 피하기 위해 axios 공통 인스턴스로 
    // 패스파라미터가 아닌 쿼리스트링 혹은 고유 주소 형태로 안전하게 호출 시도
    let deadlineDate = '-';
    try {
      const periodResponse = await tuitionService.getStudentPaymentPeriod(); 
      console.log('1. 학사 일정 조회 성공:', periodResponse);
      deadlineDate = periodResponse?.data?.endDate || '-';
    } catch (periodError) {
      console.error('학사 일정 조회 실패:', periodError);
      deadlineDate = '-'; 
    }

    // 🎯 2. 학생의 등록금 내역 목록 조회
    const listResponse = await tuitionService.getMyTuitionList();
    console.log('2. 내 등록금 목록 조회 성공:', listResponse);
    
    const listData = listResponse?.data;

    // 데이터가 존재한다면 납부 상태 화면 활성화
    if (listData && listData.length > 0) {
      isPeriod.value = true;

      const targetTuition = listData[0];
      currentTuitionId.value = targetTuition.tuitionId;

      // ✅ URL에 실제 tuitionId가 없으면 교체 (`:tuitionId` 문자열 그대로인 경우 방지)
      if (route.params.tuitionId !== String(currentTuitionId.value)) {
        router.replace(`/tuitions/${currentTuitionId.value}`);
      }
      
      // 🎯 3. 확실하게 걸러진 '숫자형 고지서 ID'만 패스 파라미터로 상세 API 호출 (payment-period 문자열 유입 차단)
      const detailResponse = await tuitionService.getMyTuitionDetail(currentTuitionId.value);
      console.log('3. 등록금 상세 내역 조회 성공:', detailResponse);
      
      const rawDetail = detailResponse?.data || {};

      // 🎯 4. 템플릿 뷰에 최종 바인딩할 데이터 취합 및 결합
      tuitionDetail.value = {
        ...targetTuition,     // 목록 기본 데이터 (year, semester 확보)
        ...rawDetail,         // 상세 데이터 (정확한 금액 및 PAID/UNPAID 상태)
        deadline: deadlineDate // 위에서 정합성 체크 완료한 실시간 기한 주입
      };

    } else {
      console.log('고지된 등록금 내역이 존재하지 않습니다.');
      isPeriod.value = false;
    }
  } catch (error) {
    console.error('등록금 프로세스 연동 최종 실패:', error);
    isPeriod.value = false; 
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
    await tuitionService.requestPayment(currentTuitionId.value);
    alert('등록금 납부 확인 과정 요청이 완료되었습니다.');
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
  if (!dateStr || dateStr === '-') return '-';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
};

onMounted(() => {
  fetchTuitionDetail();
});
</script>

<template>
  <div v-if="!isPeriod" class="empty-period">등록금납부 기간이 아닙니다.</div>

  <div v-else class="form-wrap">
    <div>

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
  </div>
</template>

<style scoped lang="scss">
// 🎯 규칙에 정의된 기간 미충족 스타일 공통 적용
.empty-period {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 18px;
  color: #999;
}

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

.state-message-box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
  border-radius: 8px;
  
  p { font-size: 18px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
  
  &.info-box {
    border: none;
    max-width: 900px;
    margin: 40px auto;
  }
  
  .msg-pending { color: #1f2937; .warning-icon { color: #d97706; } }
  .msg-paid { color: #15803d; .check-icon { color: #16a34a; } }
}
</style>