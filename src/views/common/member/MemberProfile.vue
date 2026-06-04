<script setup>
import MemberService from '@/services/memberService';
import { useAuthStore } from '@/stores/authentication';
import { onMounted, reactive, computed, ref } from 'vue';
import ProfileImg from '@/components/common/ProfileImg.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusHistoryList from '@/components/member/history-list/StatusHistoryList.vue';
import MajorHistoryList from '@/components/member/history-list/MajorHistoryList.vue';
import { useRouter, useRoute } from 'vue-router';
import { formatTel } from '@/utils/phoneNumber'
import { STATUS_LABEL, POSITION_LABEL, DEGREE_LABEL, BUILDING_LABEL } from '@/utils/constants.js'

const authStore = useAuthStore()
const router = useRouter();
const route = useRoute();

const role = ref('');

const memberCode = route.params.memberCode;
const isAdminMode = computed(() => !!route.params.memberCode)

const state = reactive({
    profileInfo: {},
    statusList:[],
    majorList:[],
    isLoading: false,
})

// 회원 본인의 프로파일 가져오기
const getUserData = async () => {
    try {
        const res = isAdminMode.value ? await MemberService.getMemberProfile(memberCode)
                                    : await MemberService.findProfile();
        state.profileInfo = res.data;
    } catch (e) {
        console.error(e)
    }
};
// 회원 변동 이력 가져오기
const getStatusList = async () => {
    try {
        let res;
        if (isAdminMode.value) {
            // 관리자가 타 회원 이력 조회
            res = role.value == 'STUDENT' ? await MemberService.findStudentStatusByAdmin(memberCode)
                : role.value == 'PROFESSOR' ? await MemberService.findProfessorStatusByAdmin(memberCode)
                : await MemberService.findAdminStatusByAdmin(memberCode)
        } else {
            // 본인 이력 조회
            res = role.value == 'STUDENT' ? await MemberService.findStudentStatus()
                : role.value == 'PROFESSOR' ? await MemberService.findProfessorStatus()
                : await MemberService.findAdminStatus()
        }
        state.statusList = res.data
    } catch (e) {
        console.error(e)
    }
}
// 학생 전공 변동 이력 가져오기
const getMajorList = async () => {
    try{
        let res;
        if(isAdminMode.value){
            res = await MemberService.findMajorChange(memberCode)
        } else{
            res = await MemberService.findMyMajorChange()
        }
        state.majorList = res.data
    } catch (e){
        console.error(e)
    }
}

// 생년월일 표기
const birthDate = yearDate =>{
    if (!yearDate) return '-'
    const data = yearDate.split('-')
    return `${data[0]}년 ${parseInt(data[1])}월 ${parseInt(data[2])}일생`
}

// 라이프사이클
onMounted(async () => {
    state.isLoading = true
    try {
        await getUserData()
        role.value = isAdminMode.value ? state.profileInfo.role : authStore.role;
        await getStatusList()
        if (role.value === 'STUDENT') await getMajorList()
    } finally {
        state.isLoading = false
    }
})
</script>

<template>
  <div style="position: relative; min-height: 200px;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <div class="d-flex g20" style="align-items: flex-start">
      <!-- 좌측 프로필 사이드바 -->
      <div class="profile-sidebar content-wrap">
        <div class="profile-img-wrap">
          <ProfileImg :memberCode="isAdminMode ? memberCode : authStore.memberCode" :existPic="state.profileInfo.pic" />
        </div>
        <div class="profile-info">
          <h2>{{ state.profileInfo.name || '-' }}</h2>
          <span>{{ state.profileInfo.memberCode }}</span>
        </div>
        <div v-if="!isAdminMode" class="btn-row direct-col g5 w100p">
          <button class="btn btn-line"
            @click="router.push(role == 'ADMIN' ? '/admin/members/edit' : '/members/edit')">
            <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 내 정보 수정
          </button>
          <button class="btn btn-line"
            @click="router.push(role == 'ADMIN' ? '/admin/members/my/password' : '/members/my/password')">
            <font-awesome-icon icon="fa-solid fa-lock" /> 비밀번호 변경
          </button>
        </div>
      </div>

      <!-- 우측 정보 영역 -->
      <div class="d-flex-grow1">
        <!-- 학적/재직 정보 -->
        <section class="card">
          <div class="card-label">
            <template v-if="role === 'STUDENT'">학적 정보</template>
            <template v-else>재직 정보</template>
          </div>
          <div class="info-grid">
            <div class="info-item" v-if="role === 'STUDENT' || role === 'PROFESSOR'">
              <span class="info-key">단과대</span>
              <span class="info-val">{{ state.profileInfo.collegeName || '-' }}</span>
            </div>
            <div class="info-item" v-if="role === 'STUDENT' || role === 'PROFESSOR'">
              <span class="info-key">
                <template v-if="role === 'STUDENT'">주전공</template>
                <template v-else>전공</template>
              </span>
              <span class="info-val">{{ role === 'STUDENT' ? state.profileInfo.mainMajorName : state.profileInfo.majorName || '-' }}</span>
            </div>
            <div class="info-item" v-if="role === 'STUDENT'">
              <span class="info-key">부전공</span>
              <span class="info-val">{{ state.profileInfo.subMajorName || '-' }}</span>
            </div>
            <div class="info-item" v-if="role === 'STUDENT'">
              <span class="info-key">학년/학기</span>
              <span class="info-val">{{ state.profileInfo.academicYear || '-' }}학년 {{ state.profileInfo.semester || '-' }}학기</span>
            </div>
            <div class="info-item" v-if="role === 'PROFESSOR'">
              <span class="info-key">학위</span>
              <span class="info-val">{{ DEGREE_LABEL[state.profileInfo.degree] || '-' }}</span>
            </div>
            <div class="info-item" v-if="role === 'PROFESSOR'">
              <span class="info-key">직위</span>
              <span class="info-val">{{ POSITION_LABEL[state.profileInfo.position] || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">상태</span>
              <span class="info-val">{{ STATUS_LABEL[role]?.[state.profileInfo.status] ?? '-' }}</span>
            </div>
            <div class="info-item" v-if="state.profileInfo.isMultiChild || state.profileInfo.isTransfer || state.profileInfo.isVeteran">
              <span class="info-key">특이사항</span>
              <span class="info-val">
                <template v-if="state.profileInfo.isMultiChild">다자녀 </template>
                <template v-if="state.profileInfo.isTransfer">편입 </template>
                <template v-if="state.profileInfo.isVeteran">보훈자녀</template>
              </span>
            </div>
            <div class="info-item">
              <span class="info-key">
                <template v-if="role === 'STUDENT'">입학시기</template>
                <template v-else>입사시기</template>
              </span>
              <span class="info-val">{{ state.profileInfo.entryDate || '-' }}</span>
            </div>
            <div class="info-item" v-if="(role === 'STUDENT' && state.profileInfo.status === 'GRADUATED') || (role !== 'STUDENT' && state.profileInfo.exitDate)">
              <span class="info-key">
                <template v-if="role === 'STUDENT'">졸업시기</template>
                <template v-else-if="role === 'PROFESSOR'">퇴임시기</template>
                <template v-else>퇴사시기</template>
              </span>
              <span class="info-val">{{ state.profileInfo.exitDate || '-' }}</span>
            </div>
          </div>
        </section>

        <!-- 연구실 정보 (교수만) -->
        <section class="card" v-if="role === 'PROFESSOR' && (state.profileInfo.labRoom || state.profileInfo.labTel)">
          <div class="card-label">연구실 정보</div>
          <div class="info-grid">
            <div class="info-item" v-if="state.profileInfo.labRoom">
              <span class="info-key">연구실 위치</span>
              <span class="info-val">{{ BUILDING_LABEL[state.profileInfo.labBuilding] || '-' }} {{ state.profileInfo.labRoom }}호</span>
            </div>
            <div class="info-item" v-if="state.profileInfo.labTel">
              <span class="info-key">연구실 번호</span>
              <span class="info-val">{{ formatTel(state.profileInfo.labTel) || '-' }}</span>
            </div>
          </div>
        </section>
        <!-- 개인 정보 -->
        <section class="card">
          <div class="card-label">개인 정보</div>
          <div class="info-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
            <div class="info-item">
              <span class="info-key">생년월일</span>
              <span class="info-val">{{ birthDate(state.profileInfo.birth) || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">이메일</span>
              <span class="info-val">{{ state.profileInfo.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">전화번호</span>
              <span class="info-val">{{ formatTel(state.profileInfo.tel) || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">비상연락망</span>
              <span class="info-val">{{ formatTel(state.profileInfo.emergencyTel) || '-' }}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1">
              <span class="info-key">주소</span>
              <span class="info-val">
                <template v-if="state.profileInfo.postcode">({{ state.profileInfo.postcode }}) </template>
                {{ state.profileInfo.address || '-' }} {{ state.profileInfo.detailAddress }}
              </span>
            </div>
          </div>
        </section>

        <StatusHistoryList :role="role" :list="state.statusList" :isLoading="state.isLoading" />
        <MajorHistoryList
          v-if="role === 'STUDENT' && state.majorList.length > 0"
          :adminView="isAdminMode"
          :list="state.majorList"
          :isLoading="state.isLoading"
        />

      </div>
    </div>

    <div v-if="isAdminMode" class="page-footer">
      <button class="btn btn-default"
        @click="router.push(role === 'PROFESSOR' ? '/admin/members/professors' : role === 'ADMIN' ? '/admin/members/admins' : '/admin/members/students')">
        <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
      </button>
      <button class="btn btn-submit"
        @click="router.push(`/admin/members/${memberCode}/edit`)">
        <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 회원 정보 수정
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-sidebar { width: 210px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; padding: 20px 16px; border: 1px solid $border-color}
.profile-info { 
  h2 { font-size: $fs-xl; font-weight: 700; margin: 0; }
  span { color: $font-color-light; font-size: $fs-sm; }
}
.info-key { min-width: 90px; }
</style>
