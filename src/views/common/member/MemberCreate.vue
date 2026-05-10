<script setup>
import { onMounted, reactive, computed, watch, ref } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import StudentFields from '@/components/member/StudentFields.vue'
import ProfessorFields from '@/components/member/ProfessorFields.vue'
import AdminFields from '@/components/member/AdminFields.vue'

// import { saveToLocalStorage, loadfromLocalStorage, clearLocalStorage, DRAFT_KEY } from '@/utils/button';
// import { checkValidation, validateFields } from '@/utils/validation';
// import { usePageStateStore } from '@/stores/pageState';

import CalendarDate from '@/components/util/CalendarDate.vue';
import SearchInput from '@/components/util/SearchInput.vue';
import ProfileImg from '@/components/common/ProfileImg.vue';

import MemberService from '@/services/memberService';

import { useModalStore } from '@/stores/modal'

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore()
// const modal = useModalStore()
// const pageState = usePageStateStore()


const role = ref('STUDENT')
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

onMounted(async () => {
  const [majors, studentStatus, professorStatus, professorPosition, professorDegree, building, adminStatus] = await Promise.all([
    MemberService.getMajorList(),
    MemberService.getStudentStatusList(),
    MemberService.getProfessorStatusList(),
    MemberService.getProfessorPositionList(),
    MemberService.getProfessorDegreeList(),
    MemberService.getBuildingList(),
    MemberService.getAdminStatusList()
  ])

  majorList.value = majors.data
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
    <div class="input-content radio-group radio-tab">
      <label class="radio-label">
        <input type="radio" name="role" value="STUDENT" v-model="role">
        <span>학생</span>
      </label>
      <label class="radio-label">
        <input type="radio" name="role" value="PROFESSOR" v-model="role">
        <span>교수</span>
      </label>
      <label class="radio-label">
        <input type="radio" name="role" value="ADMIN" v-model="role">
        <span>관리자</span>
      </label>
    </div>

    {{ student }}

    <div class="d-flex g20 jc-center">
      <div class="pf-profile content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 사진 등록</h3>
        <ProfileImg :editable="true" v-model:pic="pic" />
      </div> <!-- pf-profile-->

      <div class="pf-content d-grid g10 d-flex-grow1">
        <div class="content-wrap d-flex direct-col d-flex-grow1">
          <h3><font-awesome-icon icon="fa-solid fa-circle-info" />개인 정보</h3>
          <div class="form-grid" style="--grid-cols:repeat(auto-fill, minmax(350px,1fr))">
            <div class="input-wrap">
              <div class="input-label"><span>이름</span></div>
              <div class="input-content">
                <label>
                  <input type="text" v-model="common.name" placeholder="이름">
                </label>
              </div>
            </div>
            <div class="input-wrap">
              <div class="input-label"><span>생년월일</span></div>
              <div class="input-content">
                <CalendarDate v-model="common.birth"/>
              </div>
            </div>
            <div class="input-wrap">
              <div class="input-label"><span>전화번호</span></div>
              <div class="input-content">
                <label>
                  <input type="number" v-model="common.tel" placeholder="-없이 작성해주세요">
                </label>
              </div>
            </div>
            <div class="input-wrap">
              <div class="input-label"><span>비상<br>전화번호</span></div>
              <div class="input-content">
                <label>
                  <input type="number" v-model="common.emergencyTel" placeholder="-없이 작성해주세요">
                </label>
              </div>
            </div>
            <div class="input-wrap">
              <div class="input-label"><span>이메일</span></div>
              <div class="input-content">
                <label>
                  <input type="text" v-model="common.email" placeholder="이메일을 입력해주세요">
                </label>
              </div>
            </div>
            <div class="input-wrap g-col-full">
              <div class="input-label"><span>주소</span></div>
              <div class="d-flex direct-col g10">
                <div class="input-content d-flex g10">
                  <button type="button" @click="execDaumPostcode()" class="btn btn-line">주소 찾기</button>
                  <label class="w200">
                    <input type="text" v-model="common.postcode" placeholder="우편번호" readonly>
                  </label>
                </div>
                <div class="input-content two-input">
                  <label>
                    <input class="c-default" type="text" v-model="common.address" placeholder="도로명 주소" readonly>
                  </label>
                  <label>
                    <input type="text" v-model="common.detailAddress" placeholder="상세주소를 입력해주세요">
                  </label>
                </div>
              </div>
            </div>
          </div> <!--form-grid-->
          <StudentFields
            v-if="role === 'STUDENT'"
            :student="student"
            :majorList="majorList"
            :statusList="studentStatusList"
          />
          <ProfessorFields
            v-if="role === 'PROFESSOR'"
            :professor="professor"
            :majorList="majorList"
            :statusList="professorStatusList"
            :positionList="professorPositionList"
            :degreeList="professorDegreeList"
            :buildingList="buildingList"
          />
          <AdminFields
            v-if="role === 'ADMIN'"
            :admin="admin"
            :statusList="adminStatusList"
          />
        </div> <!-- content-wrap-->
      </div>
    </div>

    <div class="btn-row g10">
      <button class="btn btn-default" @click="router.go(-1)"><font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기</button>
      <button @click="submit" class="btn btn-submit"><font-awesome-icon icon="fa-solid fa-circle-check" /> 등록</button>
    </div>

  </div>

</template>

<style scoped lang="scss">
.form-wrap{}

.pf-profile { max-width: 280px; width: 30%; display: flex; flex-direction: column; align-self: flex-start;}
.pf-profile .pf-profile-pic { padding: var(--size-df);}


</style>