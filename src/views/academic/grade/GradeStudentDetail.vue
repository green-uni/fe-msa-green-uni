<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router       = useRouter()
const isLoading    = ref(true)
const studentInfo  = ref(null)
const gradeList    = ref([])
const summary      = ref(null)
const appealPeriod = ref(false)

const groupedGrades = computed(() => {
    const map = {}
    for (const g of gradeList.value) {
        const key = `${g.lectureYear}-${g.lectureSemester}`
        if (!map[key]) map[key] = { year: g.lectureYear, semester: g.lectureSemester, items: [] }
        map[key].items.push(g)
    }
    return Object.values(map).sort((a, b) => b.year - a.year || b.semester - a.semester)
})

onMounted(async () => {
    try {
        const res = await GradeService.getStudentGradeAll()
        studentInfo.value  = res.studentInfo
        gradeList.value    = res.gradeList ?? []
        summary.value      = res.summary
        appealPeriod.value = res.appealPeriod ?? false
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div style="position: relative">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />
        
        <template v-if="!isLoading">
            
            <!-- 학생 정보 -->
            <section v-if="studentInfo" class="card">
                <p class="card-label">학생 정보</p>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-key">이름</span>
                        <span class="info-val">{{ studentInfo.name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-key">학과</span>
                        <span class="info-val">{{ studentInfo.majorName ?? '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-key">단과대학</span>
                        <span class="info-val">{{ studentInfo.collegeName ?? '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-key">학년</span>
                        <span class="info-val">{{ studentInfo.academicYear ?? '-' }}학년</span>
                    </div>
                    <div class="info-item">
                        <span class="info-key">학기</span>
                        <span class="info-val">{{ studentInfo.semester ?? '-' }}학기</span>
                    </div>
                </div>
            </section>
            
            <!-- 하단 요약 -->
            <section v-if="summary" class="card">
                <p class="card-label">성적 요약</p>
                <div class="summary-bar">
                    <div class="summary-item">
                        <p class="summary-label">총 이수학점</p>
                        <p class="summary-value">
                            {{ summary.totalCredits }}<span class="summary-unit">학점</span>
                        </p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">실점 평균</p>
                        <p class="summary-value">
                            {{ summary.averageScore.toFixed(1) }}<span class="summary-unit">점</span>
                        </p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">등급 평균</p>
                        <p class="summary-value">
                            <span v-if="summary.averageGrade">{{ summary.averageGrade }}</span>
                            <span v-else class="no-data">-</span>
                        </p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">평점 평균</p>
                        <p class="summary-value">
                            {{ summary.averageGpa.toFixed(2) }}<span class="summary-unit"> / 4.5</span>
                        </p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">학과 석차</p>
                        <p class="summary-value rank-val">
                            {{ summary.majorRank }}<span class="summary-unit"> / {{ summary.majorTotalCount }}명</span>
                        </p>
                    </div>
                </div>
            </section>
            
            <!-- 학기별 성적 테이블 -->
            <template v-if="groupedGrades.length">
                <section
                v-for="group in groupedGrades"
                    :key="`${group.year}-${group.semester}`"
                    class="card">
                    <p class="card-label">{{ group.year }}년 {{ group.semester }}학기</p>

                    <div class="tbl-scroll">
                        <table class="data-tbl">
                            <thead>
                                <tr>
                                    <th>구분</th>
                                    <th class="col-name">교과목명</th>
                                    <th>학점</th>
                                    <th>중간<small>(30%)</small></th>
                                    <th>기말<small>(30%)</small></th>
                                    <th>과제<small>(20%)</small></th>
                                    <th>출석<small>(20%)</small></th>
                                    <th>총점</th>
                                    <th>등급</th>
                                    <th>평점</th>
                                    <th>강의 석차</th>
                                    <th v-if="group.items.some(g => g.canAppeal)">이의신청</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="g in group.items" :key="g.courseId">
                                    <td>{{ g.lectureType }}</td>
                                    <td class="col-name tal">{{ g.lectureName }}</td>
                                    <td>{{ g.lectureCredit }}</td>
                                    <td>{{ g.lectureGrade ? g.midScore        : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.finScore        : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.assignmentScore : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.attendScore     : '-' }}</td>
                                    <td>
                                        <strong v-if="g.lectureGrade">{{ g.totalScore }}</strong>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td>
                                        <span v-if="g.lectureGrade">{{ g.lectureGrade }}</span>
                                        <span v-else class="no-data">미입력</span>
                                    </td>
                                    <td>
                                        <span v-if="g.lectureRating != null">{{ g.lectureRating.toFixed(2) }}</span>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td>
                                        <span v-if="g.myRank != null">{{ g.myRank }} / {{ g.totalCount }}명</span>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td v-if="g.canAppeal">
                                        <span v-if="!g.lectureGrade" class="no-data">-</span>
                                        <span v-else-if="g.appealStatus === 'APPROVED'">승인</span>
                                        <span v-else-if="g.appealStatus === 'PENDING'">검토 중</span>
                                        <button v-else-if="g.appealStatus === 'REJECTED'"
                                                class="btn btn-danger btn-sm"
                                                @click="router.push(`/grades/${g.courseId}/appeal`)">
                                            재신청
                                        </button>
                                        <button v-else
                                                class="btn btn-line btn-sm point"
                                                @click="router.push(`/grades/${g.courseId}/appeal`)">
                                            신청하기
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </template>
            <div v-else class="empty-text">성적 데이터가 없습니다.</div>


            <div class="page-footer">
                <button class="btn btn-default" @click="router.push('/grades')"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
            </div>

        </template>
    </div>
</template>

<style scoped lang="scss">
.col-name{ min-width: 140px; white-space: normal; }
</style>
