<script setup>
import { onMounted, reactive, computed, watch, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import StudentFields from '@/components/member/StudentFields.vue'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import AdminFields from '@/components/member/AdminFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'
import codeListService from '@/services/codeService'

// import { saveToLocalStorage, loadfromLocalStorage, clearLocalStorage, DRAFT_KEY } from '@/utils/button';
// import { checkValidation, validateFields } from '@/utils/validation';
// import { usePageStateStore } from '@/stores/pageState';

import CalendarDate from '@/components/util/CalendarDate.vue'
import SearchInput from '@/components/util/SearchInput.vue'
import ProfileImg from '@/components/common/ProfileImg.vue'

import MemberService from '@/services/memberService'

import { useModalStore } from '@/stores/modal'
import { create } from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const modal = useModalStore()
// const pageState = usePageStateStore()

const role = ref('STUDENT')
const pic = ref(null)
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
  // 역할별 분기
  const roleData = role.value === 'STUDENT'   ? { ...student }
                 : role.value === 'PROFESSOR' ? { ...professor }
                 : { ...admin }

  delete roleData.majorName
  const payload = { ...common, ...roleData }

  // FormData 구성
  const formData = new FormData()
  formData.append('req', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (pic.value) {
    formData.append('pic', pic.value)
  }

  // 역할별 API 호출
  try {
    const res = role.value === 'STUDENT'   ? await MemberService.createStudent(formData)
              : role.value === 'PROFESSOR' ? await MemberService.createProfessor(formData)
              : await MemberService.createAdmin(formData)

    await modal.showAlert(res.message, 'success')
    router.push('/admin/members')
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
})
</script>

<template>
  <div class="form-wrap">
    <div class="d-flex g20 jc-center">
      <div class="pf-profile content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 사진 등록</h3>
        <ProfileImg :editable="true" v-model:pic="pic" />
      </div>
      <!-- pf-profile-->

      <div class="pf-content d-grid g10 d-flex-grow1">
        
    <div class="input-content radio-group radio-tab">
      <label class="radio-label" v-for="memberRole in memberRoles">
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
