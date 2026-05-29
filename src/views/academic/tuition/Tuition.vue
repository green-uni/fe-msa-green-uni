<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import tuitionService from '@/services/tuitionService';
import { useModalStore } from '@/stores/modal'; // 추가
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const modal = useModalStore(); // 추가
const isLoading = ref(true);
const tuitionDetail = ref(null);
const currentTuitionId = ref(null);

const isPeriod = ref(true);

const fetchTuitionDetail = async () => {
  try {
    isLoading.value = true;
    console.log('--- [시작] 데이터 동적 로딩 및 순서 보정 ---');

    let deadlineDate = '-';
    try {
      const periodResponse = await tuitionService.getStudentPaymentPeriod();
      console.log('1. 학사 일정 조회 성공:', periodResponse);
      deadlineDate = periodResponse?.data?.endDate || '-';
    } catch (periodError) {
      console.error('학사 일정 조회 실패:', periodError);
      deadlineDate = '-';
    }

    const listResponse = await tuitionService.getMyTuitionList();
    console.log('2. 내 등록금 목록 조회 성공:', listResponse);

    const listData = listResponse?.data;

    if (listData && listData.length > 0) {
      isPeriod.value = true;

      const targetTuition = listData[0];
      currentTuitionId.value = targetTuition.tuitionId;

      if (route.params.tuitionId !== String(currentTuitionId.value)) {
        router.replace(`/tuitions/${currentTuitionId.value}`);
      }

      const detailResponse = await tuitionService.getMyTuitionDetail(currentTuitionId.value);
      console.log('3. 등록금 상세 내역 조회 성공:', detailResponse);

      const rawDetail = detailResponse?.data || {};

      tuitionDetail.value = {
        ...targetTuition,
        ...rawDetail,
        deadline: deadlineDate
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
    await modal.showAlert('처리할 고지서 정보가 유효하지 않습니다.', 'warning'); // alert → modal
    return;
  }
  if (!await modal.showConfirm('가상계좌 입금 후 확인 요청 처리를 진행하시겠습니까?')) return; // confirm → modal

  try {
    await tuitionService.requestPayment(currentTuitionId.value);
    await modal.showAlert('등록금 납부 확인 과정 요청이 완료되었습니다.', 'success'); // alert → modal
    await fetchTuitionDetail();
  } catch (error) {
    console.error('납부 신청 처리 실패:', error);
    await modal.showAlert('처리에 실패했습니다. 다시 시도해 주세요.', 'error'); // alert → modal
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
onMounted(() => { fetchTuitionDetail(); });

</script>

<template>
  <div v-if="!isPeriod" class="empty-period">등록금납부 기간이 아닙니다.</div>

  <div v-else class="form-wrap" style="position: relative">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <div v-if="tuitionDetail">

      <div v-if="tuitionDetail.status === '미납' || tuitionDetail.status === 'UNPAID'">
        <div class="card">
          <h3 class="card-label">{{ tuitionDetail.year }}년 {{ tuitionDetail.semester }}학기 등록금 상세</h3>
          <div class="req-list">
            <dl class="req-row">
              <dt>기본 등록금</dt>
              <dd>{{ formatCurrency(tuitionDetail.baseAmount) }}원</dd>
            </dl>
            <dl class="req-row">
              <dt>장학금 감면</dt>
              <dd>{{ formatCurrency(tuitionDetail.totalDiscount) }}원</dd>
            </dl>
            <dl class="req-row full">
              <dt>최종 납부금액</dt>
              <dd>{{ formatCurrency(tuitionDetail.finalAmount) }}원</dd>
            </dl>
            <dl class="req-row">
              <dt>납부 기한</dt>
              <dd>{{ formatDate(tuitionDetail.deadline) }}</dd>
            </dl>
            <dl class="req-row">
              <dt>납부 상태</dt>
              <dd>미납</dd>
            </dl>
          </div>
        </div>

        <div class="card notice-panel">
          <p class="notice-title">학교 대표계좌</p>
          <p class="notice-desc">
            신한은행 110-123-456789<br>
            국민은행 6161-0104-290252<br>
            우리은행 100-262-234710<br>
            예금주: 그린대학교
          </p>
        </div>

        <div class="page-footer">
          <p class="notice-caution">납부기한까지 납부하지 않으면 등록이 취소될 수 있습니다.</p>
          <button class="btn btn-submit" @click="handlePayment">납부완료</button>
        </div>
      </div>

      <div v-else-if="tuitionDetail.status === '처리중' || tuitionDetail.status === 'PENDING'" class="card">
        <p class="empty-text">등록금 납부 확인 과정 중에 있습니다.</p>
      </div>

      <div v-else-if="tuitionDetail.status === '납부완료' || tuitionDetail.status === 'PAID'" class="card">
        <p class="empty-text">등록금을 이미 납부하였습니다.</p>
      </div>

    </div>

    <div v-else-if="!isLoading" class="card">
      <p class="empty-text">조회된 등록금 데이터가 없습니다.</p>
    </div>
  </div>
</template>