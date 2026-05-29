<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import { useModalStore } from '@/stores/modal'

const router      = useRouter()
const modal       = useModalStore()
const isLoading    = ref(true)
const studentInfo  = ref(null)
const gradeList    = ref([])
const summary      = ref(null)
const appealPeriod = ref(false)

// 학년도·학기별 그룹핑 (최신순)
const groupedGrades = computed(() => {
    const map = {}
    for (const g of gradeList.value) {
        const key = `${g.lectureYear}-${g.lectureSemester}`
        if (!map[key]) map[key] = { year: g.lectureYear, semester: g.lectureSemester, items: [] }
        map[key].items.push(g)
    }
    return Object.values(map).sort((a, b) => b.year - a.year || b.semester - a.semester)
})

const gradeClass = (letter) => {
    const map = {
        'A+': 'grade-aplus', 'A': 'grade-a',
        'B+': 'grade-bplus', 'B': 'grade-b',
        'C+': 'grade-cplus', 'C': 'grade-c',
        'D+': 'grade-dplus', 'D': 'grade-d',
        'F':  'grade-f',
    }
    return letter ? (map[letter] || '') : ''
}

onMounted(async () => {
    try {
        const res       = await GradeService.getStudentGradeAll()
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
    <div class="detail-wrap">

        <!-- 로딩 -->
        <div v-if="isLoading" class="loading-area">조회 중...</div>

        <template v-else>

            <!-- 헤더 -->
            <div class="page-header">
                <button class="btn-back" @click="router.back()">← 목록으로</button>
                <h2 class="page-title">성적 상세 조회</h2>
            </div>

            <!-- 학생 정보 -->
            <section v-if="studentInfo" class="card info-card">
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

            <!-- 학기별 성적 테이블 -->
            <template v-if="groupedGrades.length">
                <section
                    v-for="group in groupedGrades"
                    :key="`${group.year}-${group.semester}`"
                    class="card table-card">
                    <p class="card-label semester-label">{{ group.year }}년 {{ group.semester }}학기</p>

                    <div class="tbl-scroll">
                        <table class="grade-tbl">
                            <thead>
                                <tr>
                                    <th>구분</th>
                                    <th class="col-name">교과목명</th>
                                    <th>학점</th>
                                    <th>중간<br><span class="weight">(30%)</span></th>
                                    <th>기말<br><span class="weight">(30%)</span></th>
                                    <th>과제<br><span class="weight">(20%)</span></th>
                                    <th>출석<br><span class="weight">(20%)</span></th>
                                    <th>총점</th>
                                    <th>등급</th>
                                    <th>평점</th>
                                    <th>강의 석차</th>
                                    <th v-if="appealPeriod">이의신청</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="g in group.items" :key="g.courseId">
                                    <td>{{ g.lectureType }}</td>
                                    <td class="col-name text-left">{{ g.lectureName }}</td>
                                    <td>{{ g.lectureCredit }}</td>
                                    <td>{{ g.lectureGrade ? g.midScore : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.finScore : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.assignmentScore : '-' }}</td>
                                    <td>{{ g.lectureGrade ? g.attendScore : '-' }}</td>
                                    <td>
                                        <strong v-if="g.lectureGrade">{{ g.totalScore }}</strong>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td>
                                        <span v-if="g.lectureGrade" class="grade-badge">
                                            {{ g.lectureGrade }}
                                        </span>
                                        <span v-else class="no-data">미입력</span>
                                    </td>
                                    <td>
                                        <span v-if="g.lectureRating != null">{{ g.lectureRating.toFixed(2) }}</span>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td>
                                        <span v-if="g.myRank != null">
                                            {{ g.myRank }} / {{ g.totalCount }}명
                                        </span>
                                        <span v-else class="no-data">-</span>
                                    </td>
                                    <td v-if="appealPeriod">
                                        <!-- 성적 미입력: 버튼 없음 -->
                                        <span v-if="!g.lectureGrade" class="no-data">-</span>
                                        <!-- 승인됨: 비활성 -->
                                        <span v-else-if="g.appealStatus === 'APPROVED'">승인</span>
                                        <!-- 검토 중: 클릭 시 안내 모달 -->
                                        <span v-else-if="g.appealStatus === 'PENDING'">검토 중</span>
                                        <!-- 반려: 재신청 버튼 -->
                                        <button v-else-if="g.appealStatus === 'REJECTED'"
                                                class="btn-appeal rejected"
                                                @click="router.push(`/grades/${g.courseId}/appeal`)">
                                            재신청
                                        </button>
                                        <!-- 미신청: 신청하기 버튼 -->
                                        <button v-else
                                                class="btn-appeal"
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
            <div v-else class="empty-area">성적 데이터가 없습니다.</div>

            <!-- 하단 요약 -->
            <section v-if="summary" class="card summary-card">
                <p class="card-label">성적 요약</p>
                <div class="summary-grid">
                    <div class="summary-item">
                        <p class="s-label">총 이수학점</p>
                        <p class="s-value">{{ summary.totalCredits }}<span class="s-unit">학점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="s-label">실점 평균</p>
                        <p class="s-value">{{ summary.averageScore.toFixed(1) }}<span class="s-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="s-label">등급 평균</p>
                        <p class="s-value">
                            <span v-if="summary.averageGrade"
                                    :class="['grade-badge-sm', gradeClass(summary.averageGrade)]">
                                {{ summary.averageGrade }}
                            </span>
                            <span v-else class="no-data">-</span>
                        </p>
                    </div>
                    <div class="summary-item">
                        <p class="s-label">평점 평균</p>
                        <p class="s-value">
                            {{ summary.averageGpa.toFixed(2) }}
                            <span class="s-unit"> / 4.5</span>
                        </p>
                    </div>
                    <div class="summary-item summary-rank">
                        <p class="s-label">학과 석차</p>
                        <p class="s-value rank-val">
                            <strong>{{ summary.majorRank }}</strong>
                            <span class="s-unit"> / {{ summary.majorTotalCount }}명</span>
                        </p>
                    </div>
                </div>
            </section>

        </template>
    </div>
</template>

<style scoped>
.detail-wrap { max-width: 1000px; }

.loading-area, .empty-area {
    padding: 60px;
    text-align: center;
    color: var(--font-color-light);
}

/* 헤더 */
.page-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
}
.btn-back {
    background: none;
    border: 1px solid var(--line-color);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: var(--text-xs);
    color: var(--font-color-light);
    cursor: pointer;
    white-space: nowrap;
    &:hover { color: var(--font-color); border-color: var(--font-color-light); }
}
.page-title { font-size: 1.3rem; font-weight: 700; }

/* 카드 공통 */
.card {
    background: #fff;
    border: 1px solid var(--line-color);
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 14px;
}
.card-label {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--font-color);
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line-color);
}
.semester-label { color: var(--main-color); }

/* 학생 정보 */
.info-card .info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 24px;
}
.info-item {
    display: flex;
    gap: 8px;
    font-size: 14px;
}
.info-key { color: var(--font-color-light); width: 70px; flex-shrink: 0; }
.info-val { color: var(--font-color); font-weight: 500; }

/* 테이블 */
.table-card { padding: 18px 20px; }
.tbl-scroll { overflow-x: auto; }

.grade-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    white-space: nowrap;
}
.grade-tbl th {
    background: var(--default-bg);
    color: var(--font-color-light);
    font-weight: 600;
    padding: 9px 12px;
    text-align: center;
    border-bottom: 1px solid var(--line-color);
    border-top: 1px solid var(--line-color);
}
.grade-tbl td {
    padding: 10px 12px;
    text-align: center;
    border-bottom: 1px solid var(--line-color);
    color: var(--font-color);
}
.grade-tbl tr:last-child td { border-bottom: none; }
.grade-tbl .col-name { text-align: left; min-width: 140px; white-space: normal; }
.weight { font-size: 11px; font-weight: 400; }
.no-data { color: var(--font-color-light); }


/* 하단 요약 */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
}
.summary-item {
    background: var(--default-bg);
    border-radius: 8px;
    padding: 14px 10px;
    text-align: center;
}
.summary-rank { grid-column: span 1; }

.s-label { font-size: 12px; color: var(--font-color-light); margin-bottom: 8px; }
.s-value { font-size: 1.25rem; font-weight: 700; color: var(--main-color); }
.s-unit  { font-size: 12px; font-weight: 400; color: var(--font-color-light); }
.rank-val strong { font-size: 1.5rem; }

/* 등급 가운데 정렬 */
.grade-badge {
    display: inline-block;
    width: 2.2em;
    text-align: center;
}

/* 이의신청 버튼 */
.btn-appeal {
    padding: 4px 10px;
    border: 1px solid var(--main-color);
    border-radius: 4px;
    background: #fff;
    color: var(--main-color);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    &:hover { background: var(--main-color); color: #fff; }
}
.btn-appeal.rejected {
    border-color: #c62828;
    color: #c62828;
    &:hover { background: #c62828; color: #fff; }
}
.appeal-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}
</style>