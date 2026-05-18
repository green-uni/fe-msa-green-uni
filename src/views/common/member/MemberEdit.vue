<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'

import ProfileImg from '@/components/common/ProfileImg.vue'

import MemberService from '@/services/memberService'
import codeListService from '@/services/codeService'

import { useModalStore } from '@/stores/modal'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const modal = useModalStore()

const editMode = 'selfEdit';
const targetRole = ref('')

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

const submit = async () => {
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
  if (Object.keys(changed).length === 0) {
    await modal.showAlert('변경된 내용이 없습니다', 'info')
    return
  }

  // FormData 구성
  const formData = new FormData()
  formData.append('req', new Blob([JSON.stringify(changed)], { type: 'application/json' }))
  if (pic.value) {
    formData.append('pic', pic.value)
  }

  try {
    const res = await MemberService.modifyMyProfile(formData)
    await modal.showAlert(res.message, 'success')
    router.push('/members/my')
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
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
})
</script>

<template>
  <div class="form-wrap">

    <div class="d-flex g20 jc-center">
      <div class="pf-profile content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 사진 수정</h3>
        <ProfileImg :editable="true" v-model:pic="pic"/>
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
    <button @click="submit" class="btn btn-submit">
      <font-awesome-icon icon="fa-solid fa-circle-check" /> 수정
    </button>
  </div>
</template>

<style scoped lang="scss">
.form-wrap {
}

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
