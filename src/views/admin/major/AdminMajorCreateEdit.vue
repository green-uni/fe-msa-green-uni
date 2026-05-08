<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'
import CalendarDate from '@/components/util/CalendarDate.vue'   // ← 추가
import SearchInput from '@/components/util/SearchInput.vue'

const route  = useRoute()
const router = useRouter()
const modal  = useModalStore()

const majorId   = computed(() => route.params.majorId ?? null)
const isEdit    = computed(() => !!majorId.value)
const pageTitle = computed(() => isEdit.value ? '학과 정보수정' : '학과 개설')

const professorList  = ref([])
const collegeList    = ref([])

const BUILDING_OPTIONS = [
  { label: '경영관', value: 'BUSINESS'    },
  { label: '공학관', value: 'ENGINEERING' },
  { label: '인문관', value: 'HUMANITIES'  },
  { label: '예술관', value: 'ARTS'        },
  { label: '교양관', value: 'LIBERAL'     },
  { label: '이과관', value: 'SCIENCE'     },
]

const form = reactive({
  name:               '',
  majorBuilding:      '',
  room:               '',
  tel:                '',
  chairProfessorCode: null,
  capacity:           '',
  active:             '정상',
  collegeId:          '',
  info:               '',
  courseDuration: '',
  foundedDate: '',
})

const professorKeyword = ref('')

function onSelectProfessor(item) {
  form.chairProfessorCode = item.memberCode
  professorKeyword.value  = item.name
}

function resetForm() {
  // 1. 폼 데이터 초기화
  Object.assign(form, {
    name: '', majorBuilding: '', room: '', tel: '',
    chairProfessorCode: null, capacity: '',
    active: '정상', collegeId: '', info: '',
    courseDuration: '', foundedDate: ''
  })
  professorKeyword.value = ''

  // 2. 로컬 스토리지에 저장된 임시 데이터 삭제
  localStorage.removeItem('major_temp')
  modal.showAlert('내용이 모두 초기화되었습니다.', 'info')
}

function handleTempSave() {
  localStorage.setItem('major_temp', JSON.stringify({ ...form, _profKeyword: professorKeyword.value }))
  modal.showAlert('임시저장 되었습니다.', 'info')
}
function loadTemp() {
  const raw = localStorage.getItem('major_temp')
  if (!raw) return
  const saved = JSON.parse(raw)
  Object.assign(form, saved)
  if (saved._profKeyword) professorKeyword.value = saved._profKeyword
}

function validate() {
  if (!form.name.trim())      return '학과명을 입력해주세요.'
  if (!form.collegeId)        return '소속대학을 선택해주세요.'
  if (!form.majorBuilding)    return '건물을 선택해주세요.'
  if (!form.room.trim())      return '호수를 입력해주세요.'
  if (!form.tel.trim())       return '전화번호를 입력해주세요.'
  if (!form.capacity)         return '입학정원을 입력해주세요.'
  if (!form.foundedDate)      return '개설일을 선택해주세요.'
  return null
}

async function handleSubmit() {
  const err = validate()
  if (err) { await modal.showAlert(err, 'warning'); return }

  const payload = { ...form, capacity: Number(form.capacity) }

  try {
    if (isEdit.value) {
      await majorService.editMajor(majorId.value, payload)
      await modal.showAlert('학과 정보가 수정되었습니다.', 'success')
    } else {
      await majorService.createMajor(payload)
      localStorage.removeItem('major_temp')
      await modal.showAlert('학과가 등록되었습니다.', 'success')
    }
    router.push('/admin/majors')
  } catch (e) {
    const msg = e.response?.data?.message ?? '처리 중 오류가 발생했습니다.'
    await modal.showAlert(msg, 'error')
  }
}

async function fetchInitData() {
  try {
    const [cRes, pRes] = await Promise.all([
      majorService.getCollegeList(),
      majorService.getProfessorList(),
    ])
    collegeList.value   = cRes.data?.data ?? []
    professorList.value = pRes.data?.data ?? []
  } catch {
    await modal.showAlert('기초 데이터를 불러오지 못했습니다.', 'error')
  }
}

async function fetchDetail() {
  try {
    const res = await majorService.getMajor(majorId.value)
    const d   = res.data?.data
    if (!d) return

    const matched = collegeList.value.find(c => c.name === d.college)

    Object.assign(form, {
      name:               d.name,
      majorBuilding:      d.majorBuilding ?? '',
      room:               d.room ?? '',
      tel:                d.tel ?? '',
      chairProfessorCode: d.professorCode ?? null,
      capacity:           d.capacity ?? '',
      active:             d.active ?? '정상',
      collegeId:          matched?.collegeId ?? '',
      info:               d.info ?? '',
      courseDuration:     d.courseDuration ?? '',
      foundedDate:        d.foundedDate ?? '',
    })

    const prof = professorList.value.find(p => p.memberCode === d.professorCode)
    if (prof) professorKeyword.value = prof.name

  } catch {
    await modal.showAlert('학과 정보를 불러오지 못했습니다.', 'error')
  }
}

onMounted(async () => {
  await fetchInitData()
  if (isEdit.value) {
    await fetchDetail()
  } else {
    loadTemp()
  }
})
</script>

<template>
  <div>
    <div class="data-header" style="margin-bottom:20px;">
      <h2 class="page-title">
        <span class="title-icon">&#9658;</span> {{ pageTitle }}
      </h2>
      <nav class="breadcrumb">
        학과 &gt; {{ isEdit ? '학과 조회 &gt; 학과 정보수정' : '학과 개설' }}
      </nav>
    </div>

    <div class="form-card">
      <div class="form-grid">

        <!-- Row 1: 학과명 / 소속대학 / 학과구분 -->
        <div class="input-wrap">
          <label class="input-label">학과명</label>
          <div class="input-content">
            <input v-model="form.name" type="text" placeholder="학과명을 입력하세요" />
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">소속대학</label>
          <div class="input-content">
            <select v-model="form.collegeId">
              <option value="">소속대학 선택</option>
              <option v-for="c in collegeList" :key="c.collegeId" :value="c.collegeId">
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">학과 구분</label>
          <div class="input-content">
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="form.active" value="정상" /> 정상
              </label>
              <label class="radio-label">
                <input type="radio" v-model="form.active" value="폐지" /> 폐지
              </label>
            </div>
          </div>
        </div>

        <!-- Row 2: 학과장 / (빈칸) / 학과사무실 -->
        <div class="input-wrap">
          <label class="input-label">학과장명</label>
          <div class="input-content">
            <SearchInput
              v-model="professorKeyword"
              :list="professorList"
              label-key="name"
              value-key="memberCode"
              placeholder="교수명을 입력하세요"
              :show-on-focus="true"
              @select="onSelectProfessor"
            />
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">수업연한</label>
          <div class="input-content">
            <input v-model="form.courseDuration" type="number" 
                  placeholder="수업연한(년)을 입력하세요" min="1" />
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">학과사무실</label>
          <div class="input-content two-input">
            <select v-model="form.majorBuilding">
              <option value="">건물 선택</option>
              <option v-for="b in BUILDING_OPTIONS" :key="b.value" :value="b.value">
                {{ b.label }}
              </option>
            </select>
            <input v-model="form.room" type="text" placeholder="예: 201호" />
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">입학정원</label>
          <div class="input-content">
            <input v-model="form.capacity" type="number" placeholder="정원 수를 입력하세요" min="0" />
          </div>
        </div>

        <!-- 개설일: CalendarDate 컴포넌트 사용 -->
        <div class="input-wrap">
          <label class="input-label">개설일</label>
          <div class="input-content">
            <CalendarDate v-model="form.foundedDate" />
          </div>
        </div>

        <div class="input-wrap">
          <label class="input-label">전화번호</label>
          <div class="input-content">
            <input v-model="form.tel" type="text" placeholder="예: 02-0000-0000" />
          </div>
        </div>

        <!-- Row 4: 학과정보 (전체 너비) -->
        <div class="input-wrap input-grid-full">
          <label class="input-label">학과정보</label>
          <div class="input-content">
            <textarea v-model="form.info" placeholder="학과 소개를 입력하세요" />
          </div>
        </div>

      </div>
    </div>

    <!-- 버튼 -->
    <div class="footer-btn-area">
      <template v-if="!isEdit">
        <button class="btn btn-default" @click="resetForm">
          <font-awesome-icon icon="fa-solid fa-rotate-left" style="margin-right:4px;" />초기화
        </button>
        <button class="btn btn-line point" @click="handleTempSave">
          <font-awesome-icon icon="fa-regular fa-floppy-disk" style="margin-right:4px;" />임시저장
        </button>
        <button class="btn btn-submit" @click="handleSubmit">
          <font-awesome-icon icon="fa-solid fa-circle-check" style="margin-right:4px;" />등록
        </button>
      </template>

      <template v-else>
        <button class="btn btn-line" @click="router.back()">
          <font-awesome-icon icon="fa-solid fa-arrow-left" style="margin-right:4px;" />뒤로가기
        </button>
        <button class="btn btn-submit" @click="handleSubmit">
          <font-awesome-icon icon="fa-solid fa-circle-check" style="margin-right:4px;" />수정
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 기존 스타일 전부 유지 */
.page-title {
  font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px;
  .title-icon { color: var(--main-color); font-size: 0.8em; }
}
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

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
  position: relative; width: 100%;

  input:not([type='radio']), select, textarea {
    border: 1px solid var(--table-border-color); border-radius: 4px;
    padding: 8px 10px; outline: none; width: 100%;
    background: #fcfcfc; color: var(--font-color); transition: border-color 0.2s;
    &:focus   { border-color: var(--main-color); background: #fff; }
    &:disabled{ background: #f5f5f5; color: #ccc; }
  }
  textarea { min-height: 150px; resize: vertical; }

  &.two-input {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  }
}

.footer-btn-area {
  display: flex; justify-content: center; gap: 10px; margin-top: 10px;
}

.btn-close {
  background: #e74c3c; color: #fff; border: none; border-radius: 5px;
  padding: 8px 30px; font-size: var(--text-sm); font-weight: 600;
  cursor: pointer; transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
}
</style>