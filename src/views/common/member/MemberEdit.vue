<script setup>
import { onMounted, reactive, computed, watch, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import StudentFields from '@/components/member/StudentFields.vue'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import AdminFields from '@/components/member/AdminFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'

import ProfileImg from '@/components/common/ProfileImg.vue'

import MemberService from '@/services/memberService'

import { useModalStore } from '@/stores/modal'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const modal = useModalStore()

const isAdminMode = computed(() => !!route.params.memberCode)
const role = authStore.role

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


const submit = async () => {
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
    MemberService.getStudentStatusList(),
    MemberService.getProfessorStatusList(),
    MemberService.getProfessorPositionList(),
    MemberService.getProfessorDegreeList(),
    MemberService.getBuildingList(),
    MemberService.getAdminStatusList(),
  ])

  majorList.value = majors.data
  studentStatusList.value = studentStatus.data
  professorStatusList.value = professorStatus.data
  professorPositionList.value = professorPosition.data
  professorDegreeList.value = professorDegree.data
  buildingList.value = building.data
  adminStatusList.value = adminStatus.data


  const res = await MemberService.findProfile();
  const data = res.data
  console.log(res.data)

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
  const role = authStore.role
  if (role === 'STUDENT') {
    student.academicYear = data.academicYear
    student.semester = data.semester
    student.status = data.status
    student.isTransfer = data.isTransfer
    student.isMultiChild = data.isMultiChild
    student.isVeteran = data.isVeteran
    student.majorName = data.mainMajorName 
  student.entryDate = data.entryDate,
  student.exitDate = data.exitDate
  } else if (role === 'PROFESSOR') {
    professor.degree = data.degree
    professor.position = data.position
    professor.labBuilding = data.labBuilding
    professor.labRoom = data.labRoom
    professor.labTel = data.labTel
    professor.status = data.status
    professor.majorName = data.majorName
  professor.entryDate = data.entryDate,
  professor.exitDate = data.exitDate
  } else if (role === 'ADMIN') {
    admin.status = data.status
  admin.entryDate = data.entryDate,
  admin.exitDate = data.exitDate
  }

const original = ref({})
if (role === 'STUDENT') {
  original.value = JSON.parse(JSON.stringify({ ...common, ...student }))
} else if (role === 'PROFESSOR') {
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
        <ProfileImg :editable="true" v-model:pic="pic" />
      </div>
      <!-- pf-profile-->

      <div class="pf-content d-grid g10 d-flex-grow1">
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />개인 정보</h3>
          <CommonFields :common="common" :isAdminMode="isAdminMode" />
        </div>
        <!--form-grid-->
        <div class="content-wrap d-flex direct-col d-flex-grow1" v-if="role === 'PROFESSOR' || isAdminMode">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />학적 정보</h3>
            <StudentFields
              v-if="role === 'STUDENT'"
              :student="student"
              :majorList="majorList"
              :statusList="studentStatusList"
              :isAdminMode="isAdminMode"
            />
            <ProfessorFields
              v-if="role === 'PROFESSOR'"
              :professor="professor"
              :majorList="majorList"
              :statusList="professorStatusList"
              :positionList="professorPositionList"
              :degreeList="professorDegreeList"
              :buildingList="buildingList"
              :isAdminMode="isAdminMode"
            />
            <AdminFields
              v-if="role === 'ADMIN'"
              :admin="admin"
              :statusList="adminStatusList"
              :isAdminMode="isAdminMode"
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
      <font-awesome-icon icon="fa-solid fa-circle-check" /> 등록
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
