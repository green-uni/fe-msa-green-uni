<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { BUILDING_LABEL } from '@/utils/constants'

const route  = useRoute()
const router = useRouter()
const modal  = useModalStore()

const majorId = computed(() => route.params.majorId)

const state = reactive({
  detail:    null,
  professorList: [],
  isLoading: false,
})

async function fetchDetail() {
  state.isLoading = true
  try {
    const [majorRes, professorRes] = await Promise.all([
      majorService.getMajor(majorId.value),
      majorService.getProfessorList()
    ])
    
    state.detail = majorRes.data?.data ?? null
    state.professorList = professorRes.data?.data ?? []
  } catch {
    await modal.showAlert('학과 정보를 불러오지 못했습니다.', 'error')
  } finally {
    state.isLoading = false
  }
}

const displayProfessorName = computed(() => {
  if (!state.detail || !state.detail.professorCode) return '-'
  
  const prof = state.professorList.find(p => p.memberCode === state.detail.professorCode)
  return prof ? `${prof.name} (${state.detail.professorCode})` : '-'  
})

function goToEdit() {
  router.push(`/admin/majors/${majorId.value}/edit`)
}

function goBack() {
  router.push('/admin/majors')
}

onMounted(fetchDetail)
</script>

<template>
  <div class="detail-wrap">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <template v-if="!state.isLoading && state.detail">

      <!-- Card 1: 학과 기본 정보 -->
      <div class="card">
        <div class="card-label">{{ state.detail.name }}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-key">소속대학</span>
            <span class="info-val">{{ state.detail.college ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">학과장명</span>
            <span class="info-val">{{ displayProfessorName }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">수업연한</span>
            <span class="info-val">{{ state.detail.courseDuration ? `${state.detail.courseDuration}년` : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">사무실</span>
            <span class="info-val">
              {{ state.detail.majorBuilding
                  ? `${BUILDING_LABEL[state.detail.majorBuilding] ?? state.detail.majorBuilding} ${state.detail.room ?? ''}`
                  : '-' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-key">전화번호</span>
            <span class="info-val">{{ state.detail.tel ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">입학정원</span>
            <span class="info-val">{{ state.detail.capacity != null ? `${state.detail.capacity}명` : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">개설일</span>
            <span class="info-val">{{ state.detail.foundedDate ?? '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">상태</span>
            <span class="info-val">{{ state.detail.active ?? '-' }}</span>
          </div>
          <div class="info-item" v-if="state.detail.closedDate">
            <span class="info-key">폐지일</span>
            <span class="info-val">{{ state.detail.closedDate }}</span>
          </div>
        </div>
      </div>

      <!-- Card 2: 학과 소개 -->
      <div class="card">
        <p class="reason-text">{{ state.detail.info || '-' }}</p>
      </div>

      <!-- 페이지 푸터 -->
      <div class="page-footer">
        <button class="btn btn-default" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <div class="action-group">
          <button class="btn btn-submit" @click="goToEdit">
            <font-awesome-icon icon="fa-solid fa-pen" /> 수정
          </button>
        </div>
      </div>

    </template>
  </div>
</template>
