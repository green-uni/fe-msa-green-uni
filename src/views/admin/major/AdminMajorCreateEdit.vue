<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'
import CalendarDate from '@/components/util/CalendarDate.vue'
import SearchInput from '@/components/util/SearchInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route  = useRoute()
const router = useRouter()
const modal  = useModalStore()

const majorId   = computed(() => route.params.majorId ?? null)
const isEdit    = computed(() => !!majorId.value)
const pageTitle = computed(() => isEdit.value ? '학과 정보수정' : '학과 개설')

const isLoading     = ref(false)
const professorList  = ref([])
const collegeList    = ref([])
const buildingList   = ref([])

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
  closedDate:         '',
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
    courseDuration: '', foundedDate: '', closedDate: ''
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

// 1. validate 함수를 async로 변경하고 학생 존재 여부 체크 추가
async function validate() {
  if (!form.name.trim())       return '학과명을 입력해주세요.'
  if (!form.collegeId)         return '소속대학을 선택해주세요.'
  if (!form.courseDuration || form.courseDuration < 4) {
    return '수업연한을 4년 이상으로 입력해주세요.'
  }
  if (!form.majorBuilding)    return '건물을 선택해주세요.'
  if (!form.room.trim())      return '호수를 입력해주세요.'
  if (!form.capacity || form.capacity < 30) {
    return '입학정원을 30명 이상으로 입력해주세요.'
  }
  if (!form.foundedDate)      return '개설일을 선택해주세요.'
  
  // [추가 및 변경] 학과 폐지 선택 시 검증 로직
  if (form.active === '폐지') {
    if (!form.closedDate) {
      return '학과 폐지 시 폐지일을 선택해주세요.'
    }
    // 수정 모드일 때만 재학생 유무 판단 API 호출
    if (isEdit.value) {
      try {
        // 백엔드에 학생 존재 여부를 확인하는 API 요청 (상황에 맞는 endpoint 호출 필요)
        const res = await majorService.checkStudentsInMajor(majorId.value)
        if (res.data?.data?.hasStudents || res.data?.data === true) {
          return '학과 내에 재학 중인 학생(주전공/부전공)이 있어 학과를 폐지할 수 없습니다.'
        }
      } catch (e) {
        console.error(e)
        return '학생 정보 조회 중 오류가 발생했습니다.'
      }
    }
  }
  
  if (!form.tel.trim())        return '전화번호를 입력해주세요.'
  return null
}

// 2. handleSubmit 내 validate() 호출부 await 추가
async function handleSubmit() {
  const err = await validate() // ← async 함수가 되었으므로 await 추가
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
    const [cRes, pRes, bRes] = await Promise.all([
      majorService.getCollegeList(),
      majorService.getProfessorList(),
      majorService.getBuildingList(),
    ])
    collegeList.value   = cRes.data?.data ?? []
    professorList.value = pRes.data?.data ?? []
    buildingList.value  = bRes.data?.data ?? []
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
      closedDate:         d.closedDate ?? '',
    })

    const prof = professorList.value.find(p => p.memberCode === d.professorCode)
    if (prof) professorKeyword.value = prof.name

  } catch {
    await modal.showAlert('학과 정보를 불러오지 못했습니다.', 'error')
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await fetchInitData()
    if (isEdit.value) {
      await fetchDetail()
    } else {
      loadTemp()
    }
  } finally {
    isLoading.value = false
  }
})

watch(
  () => route.params.majorId,
  async (newId) => {
    if (newId) {
      await fetchDetail()
    } else {
      // 학과개설 모드로 전환 시 완전 초기화
      Object.assign(form, {
        name: '', majorBuilding: '', room: '', tel: '',
        chairProfessorCode: null, capacity: '',
        active: '정상', collegeId: '', info: '',
        courseDuration: '', foundedDate: '', closedDate: ''
      })
      professorKeyword.value = ''
      loadTemp()
    }
  }
)

watch(() => form.active, async (newVal) => {
  if (isEdit.value && newVal === '폐지') {
    try {
      const res = await majorService.checkStudentsInMajor(majorId.value)
      if (res.data?.data?.hasStudents || res.data?.data === true) {
        await modal.showAlert('해당 학과에 소속된 재학생이 존재하여 폐지할 수 없습니다.', 'warning')
        form.active = '정상' // 다시 '정상'으로 복구
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  // [추가] 상태를 다시 '정상'으로 바꾸면 입력 중이던 폐지일 데이터 초기화
  if (newVal === '정상') {
    form.closedDate = ''
  }
})

// 화면 표시용 교수 리스트 정의 ('이름(코드)' 형태)
const displayProfessorList = computed(() => {
  return professorList.value.map(prof => ({
    ...prof,
    // SearchInput 검색 및 표시용 라벨을 새로 생성합니다.
    displayName: `${prof.name} (${prof.memberCode})`
  }))
})

// 학과장 지정 취소(초기화) 함수
function clearProfessor() {
  form.chairProfessorCode = null
  professorKeyword.value = ''
}
</script>

<template>
  <div>
    <div class="form-wrap" style="position: relative; min-height: 200px;">
      <LoadingSpinner v-if="isLoading && isEdit" :overlay="true" size="md" />
      <div class="content-wrap">
        <h3>{{ pageTitle }}</h3>
        <div class="form-grid" style="--grid-cols: repeat(3, 1fr); row-gap: 28px;">

          <div class="input-wrap">
            <div class="input-label">학과명</div>
            <div class="input-content">
              <input v-model="form.name" type="text" placeholder="학과명을 입력하세요" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">소속대학</div>
            <div class="input-content">
              <select v-model="form.collegeId">
                <option value="" disabled>소속대학 선택</option>
                <option v-for="c in collegeList" :key="c.collegeId" :value="c.collegeId">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">학과구분</div>
            <div class="input-content radio-group">
              <label class="radio-label">
                <input type="radio" v-model="form.active" value="정상" /> 정상
              </label>
              <label class="radio-label">
                <input type="radio" v-model="form.active" value="폐지" /> 폐지
              </label>
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">학과장명</div>
            <div class="input-content professor-search-wrap" :class="{ 'disabled-style': !isEdit }">
              <SearchInput
                v-model="professorKeyword"
                :list="displayProfessorList"
                label-key="displayName"
                value-key="memberCode"
                placeholder="학과 개설 후 지정 가능합니다"
                :show-on-focus="isEdit"
                :disabled="!isEdit"
                @select="onSelectProfessor"
              />
              <button 
                v-if="isEdit && (form.chairProfessorCode || professorKeyword)" 
                type="button" 
                class="btn-clear-prof" 
                @click="clearProfessor"
                title="학과장 지정 취소"
              >
                <font-awesome-icon icon="fa-solid fa-trash-can" />
              </button>
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">수업연한</div>
            <div class="input-content">
              <input v-model="form.courseDuration" type="number" placeholder="수업연한(년)을 입력하세요" min="1" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">입학정원</div>
            <div class="input-content">
              <input v-model="form.capacity" type="number" placeholder="정원 수를 입력하세요" min="0" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">사무실</div>
            <div class="input-content two-input">
              <select v-model="form.majorBuilding">
                <option value="" disabled>건물 선택</option>
                <option v-for="b in buildingList" :key="b.code" :value="b.name">
                  {{ b.name }}
                </option>
              </select>
              <input v-model="form.room" type="text" placeholder="예: 201호" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">전화번호</div>
            <div class="input-content">
              <input v-model="form.tel" type="text" placeholder="예: 02-0000-0000" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">개설일</div>
            <div class="input-content">
              <CalendarDate v-model="form.foundedDate" />
            </div>
          </div>

          <div v-if="form.active === '폐지'" class="input-wrap">
            <div class="input-label">폐지일</div>
            <div class="input-content">
              <CalendarDate v-model="form.closedDate" />
            </div>
          </div>

          <div class="input-wrap input-grid-full">
            <div class="input-label">학과정보</div>
            <div class="input-content">
              <textarea v-model="form.info" placeholder="학과 소개를 입력하세요" />
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="page-footer">
      <template v-if="!isEdit">
        <button class="btn btn-default" @click="resetForm">
          <font-awesome-icon icon="fa-solid fa-rotate-left" /> 초기화
        </button>
        <div class="action-group">
          <button class="btn btn-line point" @click="handleTempSave">
            <font-awesome-icon icon="fa-regular fa-floppy-disk" /> 임시저장
          </button>
          <button class="btn btn-submit" @click="handleSubmit">
            <font-awesome-icon icon="fa-solid fa-circle-check" /> 등록
          </button>
        </div>
      </template>
      <template v-else>
        <button class="btn btn-default" @click="router.back()">
          <font-awesome-icon icon="fa-solid fa-arrow-left" /> 뒤로가기
        </button>
        <div class="action-group">
          <button class="btn btn-submit" @click="handleSubmit">
            <font-awesome-icon icon="fa-solid fa-circle-check" /> 수정
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
<style scoped lang="scss">
.disabled-style {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
  pointer-events: none; /* 클릭 이벤트 통째로 막기 */
}

.professor-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;

  :deep(.search-input-container) {
    width: 100%;
  }

  .btn-clear-prof {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;

    &:hover {
      color: #c0392b;
    }
  }
}
</style>