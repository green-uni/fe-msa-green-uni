<script setup>
import { onMounted, reactive, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import StudentFields from '@/components/member/fields/StudentFields.vue'
import ProfessorFields from '@/components/member/fields/ProfessorFields.vue'
import ProfileImg from '@/components/common/ProfileImg.vue'
import AdminFields from '@/components/member/fields/AdminFields.vue'
import CommonFields from '@/components/member/fields/CommonFields.vue'
import CalendarDate from '@/components/util/CalendarDate.vue'
import { STATUS_LABEL, POSITION_LABEL } from '@/utils/constants.js'

import MemberService from '@/services/memberService'
import codeListService from '@/services/codeService'

import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useModalStore } from '@/stores/modal'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const modal = useModalStore()

const isAdminEditMode = computed(() => !!route.params.memberCode)
const editMode = 'adminEdit'
const targetRole = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

const majorList = ref([])
const pic = ref(null)

// 상태값 목록
const studentStatusList = ref([])
const professorStatusList = ref([])
const professorPositionList = ref([])
const professorDegreeList = ref([])
const buildingList = ref([])
const adminStatusList = ref([])

// 공통 필드
const common = reactive({
  name: '',
  birth: ''
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

const availableStatusList = computed(() => {
  const currentStatus = targetRole.value === 'STUDENT' ? student.status
    : targetRole.value === 'PROFESSOR' ? professor.status : admin.status
  const list = targetRole.value === 'STUDENT' ? studentStatusList.value
    : targetRole.value === 'PROFESSOR' ? professorStatusList.value : adminStatusList.value
  return list.filter(s => s.code !== currentStatus)
})

const availablePositionList = computed(() =>
  professorPositionList.value.filter(s => s.code !== professor.position)
)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const validateProfile = () => {
  const errors = []
  if (!common.name) errors.push('이름은 비워둘 수 없습니다.')
  if (!common.birth) errors.push('생년월일은 비워둘 수 없습니다.')
  else if (!DATE_RE.test(common.birth)) errors.push('생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)')
  if (errors.length > 0) { modal.showAlert(errors.join('\n'), 'warning'); return false }
  return true
}

const validateStatus = () => {
  const errors = []
  if (targetRole.value === 'PROFESSOR') {
    if (!statusForm.status && !statusForm.position) errors.push('변경할 상태 또는 직위를 선택해주세요.')
  } else {
    if (!statusForm.status) errors.push('변경할 상태를 선택해주세요.')
  }
  if (targetRole.value === 'STUDENT' && statusForm.status === 'ABSENCE') {
    if (!statusForm.startDate) errors.push('휴학 시작일을 입력해주세요.')
    if (!statusForm.endDate) errors.push('휴학 종료일을 입력해주세요.')
    if (!statusForm.returnYear) errors.push('복학 연도를 입력해주세요.')
    if (!statusForm.returnSemester) errors.push('복학 학기를 입력해주세요.')
  }
  if ((targetRole.value === 'PROFESSOR' || targetRole.value === 'ADMIN') && statusForm.status === 'ABSENCE') {
    if (!statusForm.startDate) errors.push('휴직 시작일을 입력해주세요.')
  }
  if (targetRole.value === 'PROFESSOR' && statusForm.status === 'SABBATICAL') {
    if (!statusForm.startDate) errors.push('안식년 시작일을 입력해주세요.')
  }
  if (statusForm.startDate && statusForm.endDate && statusForm.startDate > statusForm.endDate)
    errors.push('시작일이 종료일보다 늦을 수 없습니다.')
  if (targetRole.value === 'STUDENT' && statusForm.status === 'ABSENCE' && statusForm.returnSemester !== null) {
    if (statusForm.returnSemester < 1 || statusForm.returnSemester > 2)
      errors.push('복학 학기는 1 또는 2만 입력 가능합니다.')
  }
  if (errors.length > 0) { modal.showAlert(errors.join('\n'), 'warning'); return false }
  return true
}

const submit = async () => {
  if (isLoading.value || isSubmitting.value) return

  // 프로필 변경 감지
  const current = targetRole.value === 'STUDENT' ? { ...common, ...student }
    : targetRole.value === 'PROFESSOR' ? { ...common, ...professor }
    : { ...common, ...admin }

  const changedData = {}
  Object.keys(current).forEach((key) => {
    if (current[key] !== original.value[key]) changedData[key] = current[key]
  })
  delete changedData.majorName
  const profileChanged = Object.keys(changedData).length > 0 || !!pic.value

  // 상태 변경 감지
  const currentStatus = targetRole.value === 'STUDENT' ? student.status
    : targetRole.value === 'PROFESSOR' ? professor.status : admin.status
  const statusChanged = (!!statusForm.status && statusForm.status !== currentStatus)
    || (targetRole.value === 'PROFESSOR' && !!statusForm.position && statusForm.position !== professor.position)

  if (!profileChanged && !statusChanged) {
    await modal.showAlert('변경된 내용이 없습니다', 'info')
    return
  }

  if (profileChanged && !validateProfile()) return
  if (statusChanged && !validateStatus()) return

  isSubmitting.value = true
  try {
    if (profileChanged) {
      const formData = new FormData()
      formData.append('req', new Blob([JSON.stringify(changedData)], { type: 'application/json' }))
      if (pic.value) formData.append('pic', pic.value)
      await (targetRole.value === 'STUDENT'
        ? MemberService.updateStudent(route.params.memberCode, formData)
        : targetRole.value === 'PROFESSOR'
          ? MemberService.updateProfessor(route.params.memberCode, formData)
          : MemberService.updateAdmin(route.params.memberCode, formData))
    }

    if (statusChanged) {
      const payload = Object.fromEntries(
        Object.entries(statusForm).filter(([_, v]) => v !== '' && v !== null)
      )
      await (targetRole.value === 'STUDENT'
        ? MemberService.updateStudentStatus(route.params.memberCode, payload)
        : targetRole.value === 'PROFESSOR'
          ? MemberService.updateProfessorStatus(route.params.memberCode, payload)
          : MemberService.updateAdminStatus(route.params.memberCode, payload))
    }

    original.value = {}
    await modal.showAlert('수정이 완료되었습니다.', 'success')
    router.push(`/admin/members/${route.params.memberCode}`)
  } finally {
    isSubmitting.value = false
  }
}

watch(() => statusForm.status, (val) => {
  if (val !== 'ABSENCE' && val !== 'SABBATICAL') {
    statusForm.startDate = ''
  }
  // ABSENCE 외 상태 선택 시 날짜/복학 필드 초기화
  if (val !== 'ABSENCE') {
    statusForm.endDate = ''
    statusForm.returnYear = null
    statusForm.returnSemester = null
  }
})

onMounted(async () => {
  isLoading.value = true
  try {
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
    common.birth = data.birth
    common.tel = data.tel
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
        ; ((student.entryDate = data.entryDate), (student.exitDate = data.exitDate))
    } else if (targetRole.value === 'PROFESSOR') {
      professor.degree = data.degree
      professor.position = data.position
      professor.labBuilding = data.labBuilding
      professor.labRoom = data.labRoom
      professor.labTel = data.labTel
      professor.status = data.status
      professor.majorName = data.majorName
        ; ((professor.entryDate = data.entryDate), (professor.exitDate = data.exitDate))
    } else if (targetRole.value === 'ADMIN') {
      admin.status = data.status
        ; ((admin.entryDate = data.entryDate), (admin.exitDate = data.exitDate))
    }

    if (targetRole.value === 'STUDENT') {
      original.value = JSON.parse(JSON.stringify({ ...common, ...student }))
    } else if (targetRole.value === 'PROFESSOR') {
      original.value = JSON.parse(JSON.stringify({ ...common, ...professor }))
    } else {
      original.value = JSON.parse(JSON.stringify({ ...common, ...admin }))
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div style="position: relative; min-height: 200px;">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <div class="form-wrap">
      <div class="d-flex g20">
        <div class="pf-profile content-wrap">
          <h3><font-awesome-icon icon="fa-solid fa-camera" /> 사진 수정</h3>
          <div class="pf-img-wrap">
            <ProfileImg :editable="true" v-model:pic="pic" :memberCode="route.params.memberCode" :existPic="common.pic" />
          </div>
        </div>
        <div class="pf-content d-grid g10 d-flex-grow1">
          <div class="content-wrap d-flex direct-col d-flex-grow1">
            <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 개인 정보</h3>
            <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr));padding-bottom:0">
              <div class="input-wrap">
                <div class="input-label">회원코드</div>
                <div class="input-content">
                  <input type="text" :value="route.params.memberCode" disabled />
                </div>
              </div>
            </div>
            <CommonFields :common="common" :mode="editMode" />
          </div>
          <div class="content-wrap d-flex direct-col d-flex-grow1">
            <h3><font-awesome-icon icon="fa-solid fa-circle-info" />
              <template v-if="targetRole === 'ADMIN'">재직</template><template v-else>학적</template> 정보
            </h3>
            <StudentFields v-if="targetRole === 'STUDENT'" :student="student" :majorList="majorList"
              :statusList="studentStatusList" :mode="editMode" />
            <ProfessorFields v-if="targetRole === 'PROFESSOR'" :professor="professor" :majorList="majorList"
              :statusList="professorStatusList" :positionList="professorPositionList" :degreeList="professorDegreeList"
              :buildingList="buildingList" :mode="editMode" />
            <AdminFields v-if="targetRole === 'ADMIN'" :admin="admin" :statusList="adminStatusList" :mode="editMode" />
          </div>
          <div class="content-wrap d-flex direct-col d-flex-grow1">
            <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 상태 정보 수정</h3>
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
                <div class="input-content">{{ POSITION_LABEL[professor.position] }}</div>
              </div>
              <div class="input-wrap">
                <div class="input-label">상태</div>
                <div class="input-content">
                  <select v-model="statusForm.status">
                    <option value="">상태를 선택하세요</option>
                    <option v-for="s in availableStatusList" :key="s.code" :value="s.code">{{ s.value }}</option>
                  </select>
                </div>
              </div>
              <div class="input-wrap" v-if="targetRole === 'PROFESSOR'">
                <div class="input-label">직위</div>
                <div class="input-content">
                  <select v-model="statusForm.position">
                    <option value="">직위를 선택하세요</option>
                    <option v-for="s in availablePositionList" :key="s.code" :value="s.code">{{ s.value }}</option>
                  </select>
                </div>
              </div>
              <div class="input-wrap">
                <div class="input-label">변동 사유</div>
                <div class="input-content">
                  <input type="text" v-model="statusForm.reason" placeholder="변동 사유가 있을 시 입력하세요" />
                </div>
              </div>
              <div class="input-wrap"
                v-if="statusForm.status === 'ABSENCE' || (targetRole === 'PROFESSOR' && statusForm.status === 'SABBATICAL')">
                <div class="input-label">
                  <span>
                    <template v-if="statusForm.status === 'SABBATICAL'">안식년 </template>
                    <template v-else-if="targetRole === 'PROFESSOR' || targetRole === 'ADMIN'">휴직 </template>
                    시작일
                  </span>
                  <span class="required-mark">*</span>
                </div>
                <div class="input-content">
                  <CalendarDate v-model="statusForm.startDate" />
                </div>
              </div>
              <div class="input-wrap" v-if="statusForm.status === 'ABSENCE'">
                <div class="input-label">
                  <span v-if="targetRole === 'PROFESSOR'">복직일</span><span v-else>종료일</span>
                  <span v-if="targetRole === 'STUDENT'" class="required-mark">*</span>
                </div>
                <div class="input-content">
                  <CalendarDate v-model="statusForm.endDate" />
                </div>
              </div>
              <div class="input-wrap" v-if="targetRole === 'STUDENT' && statusForm.status === 'ABSENCE'">
                <div class="input-label">복학시기 <span class="required-mark">*</span></div>
                <div class="input-content d-flex g10">
                  <input type="number" v-model="statusForm.returnYear" placeholder="연도" />
                  <input type="number" v-model="statusForm.returnSemester" placeholder="학기" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <button class="btn btn-default" @click="router.push(`/admin/members/${route.params.memberCode}`)">
        <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
      </button>
      <button @click="submit" class="btn btn-submit" :disabled="isLoading || isSubmitting">
        <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isSubmitting ? '수정 중...' : '수정' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.required-mark {
  color: $error;
  margin-left: 2px;
}
</style>
