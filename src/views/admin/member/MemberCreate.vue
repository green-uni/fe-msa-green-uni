<script setup>
import { onMounted, reactive, watch, ref, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import StudentFields from '@/components/member/StudentFields.vue'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import AdminFields from '@/components/member/AdminFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'
import codeListService from '@/services/codeService'

import ProfileImg from '@/components/common/ProfileImg.vue'

import MemberService from '@/services/memberService'
import TabNav from '@/layouts/common/TabNav.vue'

import { useModalStore } from '@/stores/modal'
import { usePageStateStore } from '@/stores/pageState'

const router = useRouter()
const modal = useModalStore()
const pageState = usePageStateStore()

const DRAFT_KEY = 'memberCreateDraft'

const today = new Date().toISOString().slice(0, 10)

const isReady   = ref(false)
const isLoading = ref(false)
const role = ref('STUDENT')
const pic  = ref(null)
const majorList = ref([])
const memberRoles = ref([])

// 상태값 목록
const studentStatusList = ref([])
const professorStatusList = ref([])
const professorPositionList = ref([])
const professorDegreeList = ref([])
const buildingList = ref([])
const adminStatusList = ref([])

// 공통 필드
const common = reactive({
  email: '', name: '',  birth: '',  tel: '',  emergencyTel: '',  postcode: '',  address: '',  detailAddress: '',pic: '',
})

// Student 필드
const student = reactive({
  majorName: '',  majorId: null,  academicYear: 1,  semester: 1,  isTransfer: false,  isMultiChild: false,  isVeteran: false,  status: 'UNREGISTERED',  entryDate: today,  exitDate: '',
})

// Professor 필드
const professor = reactive({
  majorName: '',  majorId: null,  degree: 'DOCTOR',  position: 'PROFESSOR',  labBuilding: '',  labRoom: '',  labTel: '',  status: 'EMPLOYMENT',  entryDate: today,  exitDate: '',
})

// Admin 필드
const admin = reactive({
  status: 'EMPLOYMENT',  entryDate: today,  exitDate: '',
})

async function resetForm() {
  const confirmed = await modal.showConfirm('입력한 내용이 모두 초기화됩니다. 계속하시겠습니까?', 'warning')
  if (!confirmed) return
  isReady.value = false  
  role.value = 'STUDENT'
  pic.value  = null
  Object.assign(common, { email: '', name: '', birth: '', tel: '', emergencyTel: '', postcode: '', address: '', detailAddress: '', pic: '' })
  Object.assign(student, { majorName: '', majorId: null, academicYear: 1, semester: 1, isTransfer: false, isMultiChild: false, isVeteran: false, status: 'UNREGISTERED', entryDate: today, exitDate: '' })
  Object.assign(professor, { majorName: '', majorId: null, degree: 'DOCTOR', position: 'PROFESSOR', labBuilding: '', labRoom: '', labTel: '', status: 'EMPLOYMENT', entryDate: today, exitDate: '' })
  Object.assign(admin, { status: 'EMPLOYMENT', entryDate: today, exitDate: '' })
  localStorage.removeItem(DRAFT_KEY)
  await nextTick()
  pageState.setContent(false)
  isReady.value = true
  modal.showAlert('내용이 모두 초기화되었습니다.', 'info')
}

function handleTempSave() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    role:      role.value,
    common:    { ...common },
    student:   { ...student },
    professor: { ...professor },
    admin:     { ...admin },
  }))
  modal.showAlert('임시저장 되었습니다.', 'info')
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return false
  const saved = JSON.parse(raw)
  role.value = saved.role ?? 'STUDENT'
  if (saved.common)    Object.assign(common,    saved.common)
  if (saved.student)   Object.assign(student,   saved.student)
  if (saved.professor) Object.assign(professor, saved.professor)
  if (saved.admin)     Object.assign(admin,     saved.admin)
  return true
}

onBeforeRouteLeave(async (_to, _from, next) => {
  if (pageState.isContent) {
    const confirmed = await modal.showConfirm('입력한 내용이 저장되지 않습니다. 나가시겠습니까?', 'warning')
    confirmed ? next() : next(false)
  } else {
    next()
  }
})

watch(
  [() => ({ ...common }), () => ({ ...student }), () => ({ ...professor }), () => ({ ...admin })],
  () => { if (isReady.value) pageState.setContent(true) },
  { deep: true }
)

const EMAIL_RE = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/
const TEL_RE   = /^0\d{9,10}$/

// ──── 유효성 검사 ────────────────────────────────────
const validate = () => {
  const errors = []

  // 공통
  if (!common.email) errors.push('이메일을 입력해주세요.')
  else if (!EMAIL_RE.test(common.email)) errors.push('이메일 형식이 올바르지 않습니다.')
  if (!common.name) errors.push('이름을 입력해주세요.')
  if (!common.birth) errors.push('생년월일을 입력해주세요.')
  else if (!DATE_RE.test(common.birth)) errors.push('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
  if (!common.tel) errors.push('전화번호를 입력해주세요.')
  else if (!TEL_RE.test(common.tel)) errors.push('전화번호 형식이 올바르지 않습니다. (숫자 10~11자리)')
  if (common.emergencyTel && !TEL_RE.test(common.emergencyTel)) errors.push('비상연락처 형식이 올바르지 않습니다. (숫자 10~11자리)')

  // 역할별
  if (role.value === 'STUDENT') {
    if (!student.entryDate)  errors.push('입학일을 입력해주세요.')
    else if (!DATE_RE.test(student.entryDate)) errors.push('입학일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
    if (!student.majorId) errors.push('학과를 선택해주세요.')
    if (!student.academicYear) errors.push('학년을 선택해주세요.')
    if (!student.semester) errors.push('학기를 선택해주세요.')
    if (!student.status) errors.push('상태를 선택해주세요.')
  }
  if (role.value === 'PROFESSOR') {
    if (!professor.entryDate) errors.push('입사일을 입력해주세요.')
    else if (!DATE_RE.test(professor.entryDate)) errors.push('입사일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
    if (!professor.majorId) errors.push('학과를 선택해주세요.')
    if (!professor.position) errors.push('직위를 선택해주세요.')
    if (!professor.degree) errors.push('학위를 선택해주세요.')
    if (!professor.status) errors.push('상태를 선택해주세요.')
  }
  if (role.value === 'ADMIN') {
    if (!admin.entryDate) errors.push('입사일을 입력해주세요.')
    else if (!DATE_RE.test(admin.entryDate)) errors.push('입사일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
    if (!admin.status) errors.push('상태를 선택해주세요.')
  }

  if (errors.length > 0) {
    modal.showAlert(errors.join('\n'), 'warning')
    return false
  }
  return true
}

const submit = async () => {
  if (!validate()) return

  const roleData = role.value === 'STUDENT'   ? { ...student }
                 : role.value === 'PROFESSOR' ? { ...professor }
                 : { ...admin }

  delete roleData.majorName
  const payload = { ...common, ...roleData }

  const formData = new FormData()
  formData.append('req', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (pic.value) formData.append('pic', pic.value)

  isLoading.value = true
  try {
    const res = role.value === 'STUDENT'   ? await MemberService.createStudent(formData)
              : role.value === 'PROFESSOR' ? await MemberService.createProfessor(formData)
              : await MemberService.createAdmin(formData)
    console.log(res.data)
    localStorage.removeItem(DRAFT_KEY)
    pageState.setContent(false)
    await modal.showAlert(res.message + '\n' + '회원코드: ' + res.data.memberCode, 'success')
    const route = role.value === 'STUDENT' ? '/admin/members/students'
              :role.value === 'PROFESSOR' ? '/admin/members/professors'
              : '/admin/members/admins'
    router.push(route)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  pageState.setContent(false)
  const [
    majors,
    studentStatus,
    professorStatus,
    professorPosition,
    professorDegree,
    building,
    adminStatus,
    roles
  ] = await Promise.all([
    MemberService.getMajorList(),
    codeListService.getStudentStatusList(),
    codeListService.getProfessorStatusList(),
    codeListService.getProfessorPositionList(),
    codeListService.getProfessorDegreeList(),
    codeListService.getBuildingList(),
    codeListService.getAdminStatusList(),
    codeListService.getMemberRole(),
  ])

  majorList.value = majors.data
  memberRoles.value = roles.data
  studentStatusList.value = studentStatus.data
  professorStatusList.value = professorStatus.data
  professorPositionList.value = professorPosition.data
  professorDegreeList.value = professorDegree.data
  buildingList.value = building.data
  adminStatusList.value = adminStatus.data

  await nextTick()
  isReady.value = true

  const raw = localStorage.getItem(DRAFT_KEY)
  if (raw) {
    const confirmed = await modal.showConfirm('임시저장된 내용이 있습니다. 불러오시겠습니까?', 'info')
    if (confirmed) {
      loadDraft()
    } else {
      localStorage.removeItem(DRAFT_KEY)
    }
  }
})
</script>

<template>
  <TabNav />
  <div class="form-wrap">
    <div class="d-flex g20 jc-center">
      <!-- pf-profile-->
      <div class="pf-profile content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 사진 등록</h3>
        <ProfileImg :editable="true" v-model:pic="pic" />
      </div>
      <div class="pf-content d-grid g10 d-flex-grow1">        
      <div class="input-content radio-group radio-tab">
        <label class="radio-label" v-for="memberRole in memberRoles" :key="memberRole.code">
          <input type="radio" name="role" :value="memberRole.code" v-model="role" />
          <span>{{ memberRole.value }}</span>
        </label>
      </div>
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />개인 정보</h3>
          <CommonFields :common="common" mode="create" />
        </div>
        <!--form-grid-->
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />학적 정보</h3>
          <StudentFields
            v-if="role === 'STUDENT'"
            :student="student"
            :majorList="majorList"
            :statusList="studentStatusList"
            mode="create"
          />
          <ProfessorFields
            v-if="role === 'PROFESSOR'"
            :professor="professor"
            :majorList="majorList"
            :statusList="professorStatusList"
            :positionList="professorPositionList"
            :degreeList="professorDegreeList"
            :buildingList="buildingList"
            mode="create"
          />
          <AdminFields v-if="role === 'ADMIN'" :admin="admin" :statusList="adminStatusList" mode="create" />
        </div>
        <!-- content-wrap-->
      </div>
    </div>
  </div>

  <div class="btn-row g10">
    <button class="btn btn-default" @click="router.go(-1)">
      <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
    </button>
    <button class="btn btn-default" @click="resetForm">
      <font-awesome-icon icon="fa-solid fa-rotate-left" /> 초기화
    </button>
    <button class="btn btn-line point" @click="handleTempSave">
      <font-awesome-icon icon="fa-regular fa-floppy-disk" /> 임시저장
    </button>
    <button @click="submit" class="btn btn-submit" :disabled="isLoading">
      <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isLoading ? '등록 중...' : '등록' }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.pf-profile {
  max-width: 280px;
  width: 30%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}
.pf-profile .pf-profile-pic {
  padding: var(--size-df);
}
</style>
