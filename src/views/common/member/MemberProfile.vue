<script setup>
import MemberService from '@/services/memberService';
import { useAuthStore } from '@/stores/authentication';
import { onMounted, reactive, computed } from 'vue';
import ProfileImg from '@/components/common/ProfileImg.vue';
import { useRouter } from 'vue-router';
import { formatTel } from '@/utils/phoneNumber'
import { STATUS_LABEL, POSITION_LABEL, DEGREE_LABEL } from '@/utils/constants.js'

const authStore = useAuthStore()
const router = useRouter();
const role = authStore.role

const state = reactive({
    profileInfo: {}
})



// 상태에 따른 수정 불가 여부
const unActive = computed(() => {
    const role = authStore.role
    const status = authStore.stdStatus || authStore.profStatus || authStore.stfStatus

    if (role === 'STUDENT') return status === '졸업' || status === '자퇴' || status === '퇴학'
    if (role === 'PROFESSOR') return status === '퇴임'
    if (role === 'ADMIN') return status === '퇴직'
    return false
})


// 로그인 유저 본인의 프로파일 가져오기
const getUserData = async () => {
    try {
        const res = await MemberService.findProfile();
        // console.log(res.data)
        state.profileInfo = res.data;
    } catch (e) {
        console.error(e)
    }
};

// 생년월일 표기
const birthDate = yearDate =>{
    if (!yearDate) return '-'
    const data = yearDate.split('-')
    return `${data[0]}년 ${parseInt(data[1])}월 ${parseInt(data[2])}일생`
}

// 라이프사이클
onMounted(async () => {
    getUserData();
    console.log(authStore)
})

</script>

<template>
    <div class="d-grid g20" style="--grid-cols:300px 1fr;">
        <div class="">
            <div class="info-card g20 content-wrap ">
                <div class="info-img d-flex jc-center">
                    <ProfileImg :memberCode="authStore.memberCode" :existPic="state.profileInfo.pic" />
                </div>
            <div class="info-title">
                <h2>{{ state.profileInfo.name }}</h2>
                <span class="info-detail">
                    {{ authStore.memberCode }}
                </span>
            </div>
            <div class="btn-row direct-col g5 w100p">
                <button class="btn btn-line" @click="router.push('/members/edit')" v-if="!unActive">
                    <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 내 정보 수정
                </button>
                <button class="btn btn-line" @click="router.push('/members/my/password')">
                    <font-awesome-icon icon="fa-solid fa-lock" /> 비밀번호 변경
                </button>
                </div>
            </div>
        </div>
        <div class="">
            <div class="info-wrap content-wrap direct-row g30">
                <div class="info-row g30">
                    <dl v-if="authStore.role == 'STUDENT' || authStore.role == 'PROFESSOR'">
                        <dt>단과대</dt>
                        <dd>{{ state.profileInfo.collegeName }}</dd>
                    </dl>
                    <dl v-if="authStore.role == 'STUDENT' || authStore.role == 'PROFESSOR'">
                        <dt>                
                            <template v-if="authStore.role == 'STUDENT'">주전공</template>
                            <template v-else>전공</template>
                        </dt>
                        <dd>{{ authStore.major }}</dd>
                    </dl>
                    <dl v-if="authStore.role == 'STUDENT'">
                        <dt>부전공</dt>
                        <dd>{{ state.profileInfo.subMajorName || '-' }}</dd>
                    </dl>
                    <dl v-if="authStore.role == 'STUDENT'">
                        <dt>학년</dt>
                        <dd>{{ state.profileInfo.academicYear }}</dd>
                    </dl>
                    <dl v-if="authStore.role == 'STUDENT'">
                        <dt>학기</dt>
                        <dd>{{ state.profileInfo.semester }}</dd>
                    </dl>  
                    <dl v-if="authStore.role == 'PROFESSOR'">
                        <dt>학위</dt>
                        <dd>{{ DEGREE_LABEL[state.profileInfo.degree] }}</dd>
                    </dl>
                    <dl v-if="authStore.role == 'PROFESSOR'">
                        <dt>직위</dt>
                        <dd>{{ POSITION_LABEL[state.profileInfo.position] }}</dd>
                    </dl>
                    <dl>
                        <dt>상태</dt>
                        <dd>{{ STATUS_LABEL[role][state.profileInfo.status] }}</dd>
                    </dl>  
                    <dl>
                        <dt>
                        <template v-if="authStore.role == 'STUDENT'">입학시기</template>
                        <template v-else>입사시기</template>
                        </dt>
                        <dd>{{ state.profileInfo.entryDate }}</dd>
                    </dl>
                    <dl v-if="state.profileInfo.exitDate">
                        <dt>
                        <template v-if="authStore.role == 'STUDENT'">졸업시기</template>
                        <template v-else-if="authStore.role == 'PROFESSOR'">퇴임시기</template>
                        <template v-else>퇴사시기</template>
                        </dt>
                        <dd>{{ state.profileInfo.exitDate }}</dd>
                    </dl>
                </div>
            </div>  
            <div v-if="authStore.role == 'PROFESSOR' && (state.profileInfo.labRoom || state.profileInfo.labTel)" class="info-wrap info-title-wrap content-wrap" style="--grid-cols:repeat(auto-fill, minmax(150px,1fr))">
                <h3>연구실 정보</h3>
                <div class="info-row g30">
                    <dl v-if="state.profileInfo.labRoom">
                        <dt>연구실 위치</dt>
                        <dd>{{ state.profileInfo.labBuilding || '-' }} {{ state.profileInfo.labRoom || '-' }}호</dd>
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
                        <dd>{{ birthDate(state.profileInfo.birth) }}</dd>
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
                            <span v-if="state.profileInfo.postcode">({{ state.profileInfo.postcode }})</span>
                            {{ state.profileInfo.address || '-' }} {{ state.profileInfo.detailAddress }}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.info-wrap.content-wrap{padding: 0;}
.info-row{display: flex; flex-wrap: wrap; flex-direction: row; padding:var(--size-df);}

</style>
