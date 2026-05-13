<script setup>
import { onMounted, reactive, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import StudentFields from '@/components/member/StudentFields.vue'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import AdminFields from '@/components/member/AdminFields.vue'
import CommonFields from '@/components/member/CommonFields.vue'
import CalendarDate from '@/components/util/CalendarDate.vue'
import { STATUS_LABEL } from '@/utils/constants.js'

import MemberService from '@/services/memberService'
import codeListService from '@/services/codeService'

import { useModalStore } from '@/stores/modal'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const modal = useModalStore()

const isAdminEditMode = computed(() => !!route.params.memberCode)
console.log('관리자 수정 모드: ', isAdminEditMode.value)
const editMode = 'adminEdit'
const targetRole = ref('')

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

const statusForm = reactive({
  status: '',
  reason: '',
  startDate: '',
  endDate: '',
  returnYear: null,
  returnSemester: null,
  position: '',
})

const original = ref({})

const profileSubmit = async () => {
  // 현재값 합치기
  const current =
    targetRole.value === 'STUDENT'
      ? { ...common, ...student }
      : targetRole.value === 'PROFESSOR'
        ? { ...common, ...professor }
        : { ...common, ...admin }

  // 변경된 필드만 추출
  const changedData = {}
  Object.keys(current).forEach((key) => {
    if (current[key] !== original.value[key]) changed[key] = current[key]
  })
  delete changedData.majorName

  // 변경사항 없으면 early return
  if (Object.keys(changed).length === 0) {
    await modal.showAlert('변경된 내용이 없습니다', 'info')
    return
  }

  try {
    const res =
      targetRole.value === 'STUDENT'
        ? await MemberService.updateStudent(route.params.memberCode, changedData)
        : targetRole.value === 'PROFESSOR'
          ? await MemberService.updateProfessor(route.params.memberCode, changedData)
          : await MemberService.updateAdmin(route.params.memberCode, changedData)

    await modal.showAlert(res.message, 'success')
    router.push('/admin/members')
  } catch (e) {
    console.error(e)
  }
}
const statusSubmit = async () => {
  try {
    const res =
      targetRole.value === 'STUDENT'
        ? await MemberService.updateStudentStatus(route.params.memberCode, statusForm)
        : targetRole.value === 'PROFESSOR'
          ? await MemberService.updateProfessorStatus(route.params.memberCode, statusForm)
          : await MemberService.updateAdminStatus(route.params.memberCode, statusForm)    
    await modal.showAlert(res.message, 'success')
    // 현재 상태 업데이트
    if (targetRole.value === 'STUDENT') student.status = statusForm.status
    else if (targetRole.value === 'PROFESSOR') professor.status = statusForm.status
    else admin.status = statusForm.status
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

  const res = isAdminEditMode.value
    ? await MemberService.getMemberProfile(route.params.memberCode)
    : await MemberService.findProfile()
  const data = res.data
  targetRole.value = isAdminEditMode.value ? data.role : authStore.role

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
    ;((student.entryDate = data.entryDate), (student.exitDate = data.exitDate))
  } else if (targetRole.value === 'PROFESSOR') {
    professor.degree = data.degree
    professor.position = data.position
    professor.labBuilding = data.labBuilding
    professor.labRoom = data.labRoom
    professor.labTel = data.labTel
    professor.status = data.status
    professor.majorName = data.majorName
    ;((professor.entryDate = data.entryDate), (professor.exitDate = data.exitDate))
  } else if (targetRole.value === 'ADMIN') {
    admin.status = data.status
    ;((admin.entryDate = data.entryDate), (admin.exitDate = data.exitDate))
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
      <div class="pf-content d-grid g10 d-flex-grow1">
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />개인 정보</h3>
          <CommonFields :common="common" :mode="editMode" />
        </div>
        <!--form-grid-->
        <div class="content-wrap d-flex direct-col d-flex-grow1" v-if="targetRole !== 'ADMIN'">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />학적 정보</h3>
          <StudentFields
            v-if="targetRole === 'STUDENT'"
            :student="student"
            :majorList="majorList"
            :statusList="studentStatusList"
            :mode="editMode"
          />
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
          <AdminFields
            v-if="targetRole === 'ADMIN'"
            :admin="admin"
            :statusList="adminStatusList"
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
    <button @click="profileSubmit" class="btn btn-submit">
      <font-awesome-icon icon="fa-solid fa-circle-check" /> 수정
    </button>
  </div>

  <div class="d-flex g20 jc-center">
    <div class="pf-content d-grid g10 d-flex-grow1">
      <div class="content-wrap d-flex direct-col d-flex-grow1">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" />상태 정보 수정</h3>
        <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr))">
          <div class="input-wrap">
            <div class="input-label">현재 상태</div>
            <div class="input-content">
              {{
                STATUS_LABEL[targetRole]?.[
                  targetRole === 'STUDENT'
                    ? student.status
                    : targetRole === 'PROFESSOR'
                      ? professor.status
                      : admin.status
                ]
              }}
            </div>
          </div>
          <div class="input-wrap" v-if="targetRole === 'PROFESSOR'">
            <div class="input-label">현재 직위</div>
            <div class="input-content">
              {{ professor.position }}
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">상태</div>
            <div class="input-content">
              <select v-model="statusForm.status">
                <option value="">상태를 선택하세요</option>
                <option
                  v-for="s in targetRole === 'STUDENT'
                    ? studentStatusList
                    : targetRole === 'PROFESSOR'
                      ? professorStatusList
                      : adminStatusList"
                  :key="s.code"
                  :value="s.code"
                >
                  {{ s.value }}
                </option>
              </select>
            </div>
          </div>
          <div class="input-wrap" v-if="targetRole === 'PROFESSOR'">
            <div class="input-label">직위</div>
            <div class="input-content">
              <select v-model="statusForm.position">
                <option value="">상태를 선택하세요</option>
                <option v-for="s in professorPositionList" :key="s.code" :value="s.code">
                  {{ s.value }}
                </option>
              </select>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">변동 사유</div>
            <div class="input-content">
              <input
                type="text"
                v-model="statusForm.reason"
                placeholder="변동 사유가 있을 시 입력하세요"
              />
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">
              <span><template v-if="targetRole === 'PROFESSOR'">휴직 </template>시작일</span>
            </div>
            <div class="input-content">
              <CalendarDate v-model="statusForm.startDate" />
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">
              <span v-if="targetRole === 'PROFESSOR'">복직일</span><span v-else>종료일</span>
            </div>
            <div class="input-content">
              <CalendarDate v-model="statusForm.endDate" />
            </div>
          </div>
          <div
            class="input-wrap"
            v-if="targetRole === 'STUDENT' && statusForm.status === 'ABSENCE'"
          >
            <div class="input-label">복학시기</div>
            <div class="input-content d-flex g10">
              <input type="number" v-model="statusForm.returnYear" placeholder="연도" />
              <input type="number" v-model="statusForm.returnSemester" placeholder="학기" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <div class="btn-row g10">
      <button @click="statusSubmit" class="btn btn-submit">
        <font-awesome-icon icon="fa-solid fa-circle-check" /> 상태변경
      </button>
    </div>
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
