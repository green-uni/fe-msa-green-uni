<script setup>
import MemberService from '@/services/memberService';
import { useAuthStore } from '@/stores/authentication';
import { onMounted, reactive, computed, ref } from 'vue';
import ProfileImg from '@/components/common/ProfileImg.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusList from '@/components/member/StatusList.vue';
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
    } finally {
        state.isLoading = false
    }
})
</script>

<template>
    <div class="d-grid g20" style="--grid-cols:300px 1fr;position: relative; min-height: 200px;">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
        <div class="">
            <div class="info-card g20 content-wrap ">
                <div class="info-img d-flex jc-center">
                    <ProfileImg :memberCode="isAdminMode ? memberCode : authStore.memberCode" :existPic="state.profileInfo.pic" />
                </div>
            <div class="info-title">
                <h2>{{ state.profileInfo.name || '-' }}</h2>
                <span class="info-detail">
                    {{ state.profileInfo.memberCode }}
                </span>
            </div>
            <div class="btn-row direct-col g5 w100p">
                <button class="btn btn-line" @click="router.push(isAdminMode ? `/admin/members/${memberCode}/edit` : 
                role == 'ADMIN' ? '/admin/members/edit': `/members/edit`)">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 
                    <template v-if="isAdminMode">회원</template>
                    <template v-else>내</template> 정보 수정
                </button>
                <button v-if="!isAdminMode" class="btn btn-line" @click="router.push(role == 'ADMIN' ? '/admin/members/my/password' : '/members/my/password')">
                    <font-awesome-icon icon="fa-solid fa-lock" /> 비밀번호 변경
                </button>
                </div>
            </div>
        </div>
        <div>
            <div class="info-wrap content-wrap direct-row g30">
                <div class="info-row g30">
                    <dl v-if="role == 'STUDENT' || role == 'PROFESSOR'">
                        <dt>단과대</dt>
                        <dd>{{ state.profileInfo.collegeName || '-' }}</dd>
                    </dl>
                    <dl v-if="role == 'STUDENT' || role == 'PROFESSOR'">
                        <dt>
                            <template v-if="role == 'STUDENT'">주전공</template>
                            <template v-else>전공</template>
                        </dt>
                        <dd>{{ role == 'STUDENT' ? state.profileInfo.mainMajorName  :
                                role == 'PROFESSOR' ? state.profileInfo.majorName : '-' }}</dd>
                    </dl>
                    <dl v-if="role == 'STUDENT'">
                        <dt>부전공</dt>
                        <dd>{{ state.profileInfo.subMajorName || '-' }}</dd>
                    </dl>
                    <dl v-if="role == 'STUDENT'">
                        <dt>학년/학기</dt>
                        <dd>{{ state.profileInfo.academicYear || '-' }}학년 {{ state.profileInfo.semester || '-' }}학기</dd>
                    </dl>
                    <dl v-if="role == 'PROFESSOR'">
                        <dt>학위</dt>
                        <dd>{{ DEGREE_LABEL[state.profileInfo.degree] || '-' }}</dd>
                    </dl>
                    <dl v-if="role == 'PROFESSOR'">
                        <dt>직위</dt>
                        <dd>{{ POSITION_LABEL[state.profileInfo.position] || '-' }}</dd>
                    </dl>
                    <dl>
                        <dt>상태</dt>
                        <dd>{{ STATUS_LABEL[role]?.[state.profileInfo.status] ?? '-' }}</dd>
                    </dl>
                    <dl v-if="state.profileInfo.isMultiChild || state.profileInfo.isTransfer || state.profileInfo.isVeteran">
                        <dt>특이사항</dt>
                        <dd>
                            <template v-if="state.profileInfo.isMultiChild">다자녀</template>
                            <template v-if="state.profileInfo.isTransfer">편입</template>
                            <template v-if="state.profileInfo.isVeteran">보훈자녀</template>
                        </dd>
                    </dl>
                    <dl>
                        <dt>
                        <template v-if="role == 'STUDENT'">입학시기</template>
                        <template v-else>입사시기</template>
                        </dt>
                        <dd>{{ state.profileInfo.entryDate || '-' }}</dd>
                    </dl>
                    <dl v-if="(role == 'STUDENT' && state.profileInfo.status  === 'GRADUATED') || (role != 'STUDENT' && state.profileInfo.exitDate)">
                        <dt>
                        <template v-if="role == 'STUDENT'">졸업시기</template>
                        <template v-else-if="role == 'PROFESSOR'">퇴임시기</template>
                        <template v-else>퇴사시기</template>
                        </dt>
                        <dd>{{ state.profileInfo.exitDate || '-' }}</dd>
                    </dl>
                </div>
            </div>
            <div v-if="role == 'PROFESSOR' && (state.profileInfo.labRoom || state.profileInfo.labTel)" class="info-wrap info-title-wrap content-wrap" style="--grid-cols:repeat(auto-fill, minmax(150px,1fr))">
                <h3>연구실 정보</h3>
                <div class="info-row g30">
                    <dl v-if="state.profileInfo.labRoom">
                        <dt>연구실 위치</dt>
                        <dd>{{ BUILDING_LABEL[state.profileInfo.labBuilding] || '-' }} {{ state.profileInfo.labRoom || '-' }}호</dd>
                    </dl>
                    <dl v-if="state.profileInfo.labTel">
                        <dt>연구실 번호</dt>
                        <dd>{{ formatTel(state.profileInfo.labTel) || '-' }}</dd>
                    </dl>
                </div>
            </div>
            <div class="info-wrap info-title-wrap content-wrap">
                <h3>개인 정보</h3>
                <div class="info-row g30">
                    <dl>
                        <dt>생년월일</dt>
                        <dd>{{ birthDate(state.profileInfo.birth)  || '-'}}</dd>
                    </dl>
                    <dl>
                        <dt>이메일</dt>
                        <dd>{{ state.profileInfo.email || '-' }}</dd>
                    </dl>
                    <dl>
                        <dt>전화번호</dt>
                        <dd>{{ formatTel(state.profileInfo.tel) || '-' }}</dd>
                    </dl>
                    <dl>
                        <dt>비상연락망</dt>
                        <dd>{{ formatTel(state.profileInfo.emergencyTel) || '-' }}</dd>
                    </dl>
                    <dl class="w100p">
                        <dt>주소</dt>
                        <dd>
                            <span v-if="state.profileInfo.postcode">({{ state.profileInfo.postcode || '-' }})</span>
                            {{ state.profileInfo.address || '-' }} {{ state.profileInfo.detailAddress || '-' }}
                        </dd>
                    </dl>
                </div>
            </div>
            <StatusList :role="role" :list="state.statusList" :isLoading="state.isLoading"  />
        </div>
        <div v-if="isAdminMode" class="btn-row g10">
            <button class="btn btn-default" @click="router.push(role === 'PROFESSOR' ? '/admin/members/professors' : role === 'ADMIN' ? '/admin/members/admins' : '/admin/members/students')">
                <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
            </button>
        </div>
    </div>
</template>

<style scoped>
.info-wrap.content-wrap{padding: 0;}
.info-row{display: flex; flex-wrap: wrap; flex-direction: row; padding:var(--size-df);}
</style>
