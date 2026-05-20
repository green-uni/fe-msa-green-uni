<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'
import ProfileImg from '@/components/common/ProfileImg.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MemberService from '@/services/memberService'
import codeListService from '@/services/codeService'
import { useModalStore } from '@/stores/modal'

const router = useRouter()
const authStore = useAuthStore()
const modal = useModalStore()

const editMode = 'selfEdit';
const targetRole = ref('')
const isLoading = ref(false)

const pic = ref(null)
const majorList = ref([])

// 상태값 목록
const studentStatusList = ref([])
const professorStatusList = ref([])
const professorPositionList = ref([])
const professorDegreeList = ref([])
const buildingList = ref([])
const adminStatusList = ref([])

// 공통 필드
const common = reactive({
  email: '',
  name: '',
  birth: '',
  tel: '',
  emergencyTel: '',
  postcode: '',
  address: '',
  detailAddress: '',
  pic: '',
})

// Student 필드
const student = reactive({
  majorName: '',
  majorId: null,
  academicYear: null,
  semester: null,
  isTransfer: false,
  isMultiChild: false,
  isVeteran: false,
  status: '',
  entryDate: '',
  exitDate: '',
})

// Professor 필드
const professor = reactive({
  majorName: '',
  majorId: null,
  degree: '',
  position: '',
  labBuilding: '',
  labRoom: '',
  labTel: '',
  status: '',
  entryDate: '',
  exitDate: '',
})

// Admin 필드
const admin = reactive({
  status: '',
  entryDate: '',
  exitDate: '',
})

const original = ref({})

const EMAIL_RE = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/
const TEL_RE   = /^0\d{9,10}$/

const validate = () => {
  const errors = []
  if (!common.email) errors.push('이메일을 입력해주세요.')
  else if (!EMAIL_RE.test(common.email)) errors.push('이메일 형식이 올바르지 않습니다.')
  if (!common.name) errors.push('이름을 입력해주세요.')
  if (!common.birth) errors.push('생년월일을 입력해주세요.')
  else if (!DATE_RE.test(common.birth)) errors.push('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
  if (!common.tel) errors.push('전화번호를 입력해주세요.')
  else if (!TEL_RE.test(common.tel)) errors.push('전화번호 형식이 올바르지 않습니다. (숫자 10~11자리)')
  if (common.emergencyTel && !TEL_RE.test(common.emergencyTel)) errors.push('비상연락처 형식이 올바르지 않습니다. (숫자 10~11자리)')
  if (errors.length > 0) {
    modal.showAlert(errors.join('\n'), 'warning')
    return false
  }
  return true
}

const submit = async () => {
  if (!validate()) return
  if (isLoading.value) return

  // 현재값 합치기
  const current = targetRole.value === 'STUDENT'   ? { ...common, ...student }
              : targetRole.value === 'PROFESSOR' ? { ...common, ...professor }
              : { ...common, ...admin }

  // 변경된 필드만 추출
  const changed = {}
  Object.keys(current).forEach(key => {
    if (current[key] !== original.value[key]) changed[key] = current[key]
  })

  // majorName은 전송 제외
  delete changed.majorName

  // 변경사항 없으면 early return
  if (Object.keys(changed).length === 0 && !pic.value) {
    await modal.showAlert('변경된 내용이 없습니다', 'info')
    return
  }

  // FormData 구성
  const formData = new FormData()
  formData.append('req', new Blob([JSON.stringify(changed)], { type: 'application/json' }))
  if (pic.value) formData.append('pic', pic.value)

  isLoading.value = true
  try {
    const res = await MemberService.modifyMyProfile(formData)
    if (changed.name) authStore.name = changed.name
    original.value = {}
    await modal.showAlert(res.message, 'success')
    router.push(authStore.role == 'ADMIN' ? '/admin/members/my' : '/members/my')
  } finally {
    isLoading.value = false
  }
}

onBeforeRouteLeave(async (_to, _from, next) => {
  if (!original.value || Object.keys(original.value).length === 0) { next(); return }

  const current = targetRole.value === 'STUDENT'   ? { ...common, ...student }
              : targetRole.value === 'PROFESSOR' ? { ...common, ...professor }
              : { ...common, ...admin }
  delete current.majorName

  const hasChanges = Object.keys(current).some(key => current[key] !== original.value[key]) || !!pic.value
  if (hasChanges) {
    const confirmed = await modal.showConfirm('입력한 내용이 저장되지 않습니다. 나가시겠습니까?', 'warning')
    confirmed ? next() : next(false)
  } else {
    next()
  }
})

onMounted(async () => {
  isLoading.value = true
  const [
    majors,
    studentStatus,
    professorStatus,
    professorPosition,
    professorDegree,
    building,
    adminStatus,
  ] = await Promise.all([
    MemberService.getMajorList(),
    codeListService.getStudentStatusList(),
    codeListService.getProfessorStatusList(),
    codeListService.getProfessorPositionList(),
    codeListService.getProfessorDegreeList(),
    codeListService.getBuildingList(),
    codeListService.getAdminStatusList(),
  ])

  majorList.value = majors.data
  studentStatusList.value = studentStatus.data
  professorStatusList.value = professorStatus.data
  professorPositionList.value = professorPosition.data
  professorDegreeList.value = professorDegree.data
  buildingList.value = building.data
  adminStatusList.value = adminStatus.data

  const res = await MemberService.findProfile()
  const data = res.data
  targetRole.value = authStore.role

  // 공통 필드 채우기
  common.name = data.name
  common.email = data.email
  common.birth = data.birth
  common.tel = data.tel
  common.emergencyTel = data.emergencyTel
  common.postcode = data.postcode
  common.address = data.address
  common.detailAddress = data.detailAddress
  common.pic = data.pic

  // 역할별 필드 채우기
  if (targetRole.value === 'STUDENT') {
    student.academicYear = data.academicYear
    student.semester = data.semester
    student.status = data.status
    student.isTransfer = data.isTransfer
    student.isMultiChild = data.isMultiChild
    student.isVeteran = data.isVeteran
    student.majorName = data.mainMajorName
  student.entryDate = data.entryDate,
  student.exitDate = data.exitDate
  } else if (targetRole.value === 'PROFESSOR') {
    professor.degree = data.degree
    professor.position = data.position
    professor.labBuilding = data.labBuilding
    professor.labRoom = data.labRoom
    professor.labTel = data.labTel
    professor.status = data.status
    professor.majorName = data.majorName
  professor.entryDate = data.entryDate,
  professor.exitDate = data.exitDate
  } else if (targetRole.value === 'ADMIN') {
    admin.status = data.status
  admin.entryDate = data.entryDate,
  admin.exitDate = data.exitDate
  }

  if (targetRole.value === 'STUDENT') {
    original.value = JSON.parse(JSON.stringify({ ...common, ...student }))
  } else if (targetRole.value === 'PROFESSOR') {
    original.value = JSON.parse(JSON.stringify({ ...common, ...professor }))
  } else {
    original.value = JSON.parse(JSON.stringify({ ...common, ...admin }))
  }

  isLoading.value = false
})
</script>

<template>
  <div class="form-wrap" style="position: relative; min-height: 200px;">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <div class="d-flex g20 jc-center">
      <div class="pf-profile content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 사진 수정</h3>
        <ProfileImg :editable="true" v-model:pic="pic" :memberCode="authStore.memberCode" :existPic="common.pic" />
      </div>
      <!-- pf-profile-->

      <div class="pf-content d-grid g10 d-flex-grow1">
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />개인 정보</h3>
          <CommonFields :common="common" :mode="editMode" />
        </div>
        <!--form-grid-->
        <div class="content-wrap d-flex direct-col d-flex-grow1" v-if="targetRole === 'PROFESSOR'">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />학적 정보</h3>
            <ProfessorFields
              v-if="targetRole === 'PROFESSOR'"
              :professor="professor"
              :majorList="majorList"
              :statusList="professorStatusList"
              :positionList="professorPositionList"
              :degreeList="professorDegreeList"
              :buildingList="buildingList"
              :mode="editMode"
            />
        </div>
        <!-- content-wrap-->
      </div>
    </div>
  </div>

  <div class="btn-row g10">
    <button class="btn btn-default" @click="router.go(-1)">
      <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
    </button>
    <button @click="submit" class="btn btn-submit" :disabled="isLoading">
      <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isLoading ? '수정 중...' : '수정' }}
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
