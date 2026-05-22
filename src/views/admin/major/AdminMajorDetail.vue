<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'

const route  = useRoute()
const router = useRouter()
const modal  = useModalStore()

const majorId = computed(() => route.params.majorId)

const state = reactive({
  detail:      null,
  collegeList: [],
  isLoading:   false,
})

const BUILDING_LABEL = {
  BUSINESS:    '경영관',
  ENGINEERING: '공학관',
  HUMANITIES:  '인문관',
  ARTS:        '예술관',
  LIBERAL:     '교양관',
  SCIENCE:     '이과관',
}

function getBuildingLabel(val) {
  return BUILDING_LABEL[val] ?? val ?? '-'
}

const STATUS_MAP = {
  '정상': { label: '정상', cls: 'badge-running' },
  '폐지': { label: '폐지', cls: 'badge-closed'  },
}

function getStatusBadge(active) {
  return STATUS_MAP[active] ?? { label: active ?? '-', cls: 'badge-closed' }
}

async function fetchDetail() {
  state.isLoading = true
  try {
    const [detailRes, collegesRes] = await Promise.all([
      majorService.getMajor(majorId.value),
      majorService.getCollegeList(),
    ])
    state.detail      = detailRes.data?.data ?? null
    state.collegeList = collegesRes.data?.data ?? []
  } catch {
    await modal.showAlert('학과 정보를 불러오지 못했습니다.', 'error')
  } finally {
    state.isLoading = false
  }
}

function goToEdit() {
  router.push(`/admin/majors/${majorId.value}/edit`)
}

function goBack() {
  router.push('/admin/majors')
}

onMounted(fetchDetail)
</script>

<template>
  <div>
    <div class="data-header" style="margin-bottom:20px;">
      <h2 class="page-title">
        <span class="title-icon">&#9658;</span> 학과 상세조회
      </h2>
      <nav class="breadcrumb">학과 &gt; 학과 조회 &gt; 학과 상세조회</nav>
    </div>

    <div v-if="state.isLoading" class="loading-area">불러오는 중...</div>

    <template v-else-if="state.detail">
      <div class="form-card">
        <div class="form-grid">

          <div class="input-wrap">
            <label class="input-label">학과명</label>
            <div class="input-content">
              <span class="detail-value">{{ state.detail.name ?? '-' }}</span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">소속대학</label>
            <div class="input-content">
              <span class="detail-value">{{ state.detail.college ?? '-' }}</span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">학과 구분</label>
            <div class="input-content">
              <span
                class="status-badge"
                :class="getStatusBadge(state.detail.active).cls"
              >
                {{ getStatusBadge(state.detail.active).label }}
              </span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">학과장명</label>
            <div class="input-content">
              <span class="detail-value">{{ state.detail.professorName ?? '-' }}</span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">수업연한</label>
            <div class="input-content">
              <span class="detail-value">
                {{ state.detail.courseDuration ? `${state.detail.courseDuration}년` : '-' }}
              </span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">학과사무실</label>
            <div class="input-content">
              <span class="detail-value">
                {{ state.detail.majorBuilding
                    ? `${getBuildingLabel(state.detail.majorBuilding)} ${state.detail.room ?? ''}`
                    : '-' }}
              </span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">입학정원</label>
            <div class="input-content">
              <span class="detail-value">
                {{ state.detail.capacity != null ? `${state.detail.capacity}명` : '-' }}
              </span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">개설일</label>
            <div class="input-content">
              <span class="detail-value">{{ state.detail.foundedDate ?? '-' }}</span>
            </div>
          </div>

          <div class="input-wrap">
            <label class="input-label">전화번호</label>
            <div class="input-content">
              <span class="detail-value">{{ state.detail.tel ?? '-' }}</span>
            </div>
          </div>

          <div class="input-wrap input-grid-full">
            <label class="input-label">학과정보</label>
            <div class="input-content">
              <span class="detail-value info-text">{{ state.detail.info || '-' }}</span>
            </div>
          </div>

        </div>
      </div>

      <div class="footer-btn-area">
        <button class="btn btn-line" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-arrow-left" style="margin-right:4px;" />목록
        </button>
        <button class="btn btn-submit" @click="goToEdit">
          <font-awesome-icon icon="fa-solid fa-pen" style="margin-right:4px;" />수정
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-title {
  font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px;
  .title-icon { color: var(--main-color); font-size: 0.8em; }
}
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.loading-area {
  text-align: center; padding: 60px 0; color: var(--font-color-light);
}

.form-card {
  background: #fff; border: 1px solid var(--line-color);
  border-radius: var(--bdrs-df); margin-bottom: 20px;
}
.form-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  row-gap: 28px; column-gap: 20px; padding: 28px 32px;
}
.input-grid-full { grid-column: 1 / -1; }

.input-wrap {
  display: grid; grid-template-columns: 70px 1fr;
  align-items: center; gap: 12px;
}
.input-label {
  text-align: right; font-weight: bold; font-size: var(--text-sm);
  white-space: nowrap; word-break: keep-all; line-height: 1.3;
}
.input-content {
  width: 100%;
}

.detail-value {
  font-size: var(--text-sm); color: var(--font-color);
  padding: 8px 10px; display: block;
  border-bottom: 1px solid var(--line-color);
  min-height: 36px; line-height: 1.5;

  &.info-text {
    white-space: pre-wrap; min-height: 80px;
  }
}

.footer-btn-area {
  display: flex; justify-content: center; gap: 10px; margin-top: 10px;
}
</style>