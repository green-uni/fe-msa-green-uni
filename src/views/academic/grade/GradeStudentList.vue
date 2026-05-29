<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import GradeService from '@/services/gradeService'

const router = useRouter()

const isLoading  = ref(true)
const allGrades  = ref([])

// ── 학기 필터 ────────────────────────────────────
const selectedYear     = ref(null)
const selectedSemester = ref(null)

// 데이터에서 고유 학년도, 학기 조합 추출 (최신순 정렬)
const semesterOptions = computed(() => {
    const seen   = new Set()
    const result = []
    for (const g of allGrades.value) { //실제 성적 데이터 기반
        const key = `${g.lectureYear}-${g.lectureSemester}`
        if (!seen.has(key)) {
            seen.add(key)
            result.push({ year: g.lectureYear, semester: g.lectureSemester })
        }
    }
    return result.sort((a, b) => b.year - a.year || b.semester - a.semester)
})

const filteredList = computed(() => {
    if (selectedYear.value === null) return allGrades.value
    return allGrades.value.filter(
        g => g.lectureYear === selectedYear.value && g.lectureSemester === selectedSemester.value
    )
})

// ── summary: 필터된 목록 기준 재계산 ────────────────────────────────────
const summary = computed(() => {
    const graded = filteredList.value.filter(g => g.lectureRating != null)
    if (!graded.length) return { averageGpa: '-', convertedScore: '-', totalCredits: 0 }

    const sumWeighted = graded.reduce((acc, g) => acc + g.lectureRating * g.lectureCredit, 0)
    const sumCredits  = graded.reduce((acc, g) => acc + g.lectureCredit, 0)
    const avg         = sumCredits > 0 ? Math.round(sumWeighted / sumCredits * 100) / 100 : 0
    const converted   = Math.round(avg / 4.5 * 100)
    const totalCredits = graded.reduce((acc, g) => acc + g.lectureCredit, 0)

    return { averageGpa: avg.toFixed(2), convertedScore: converted, totalCredits }
})

// 모든 과목의 강의평가가 완료되었는지 (상세보기 버튼 활성 여부)
const allEvalCompleted = computed(() =>
    allGrades.value.length > 0 && allGrades.value.every(g => g.evalCompleted)
)

const selectSemester = (year, semester) => {
    selectedYear.value     = year
    selectedSemester.value = semester
}

// ── 등급 뱃지 CSS ────────────────────────
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
        const res = await GradeService.getStudentGrades()
        allGrades.value = res.gradeList ?? []
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="grade-student-wrap">

        <!-- 학기 필터 탭 -->
        <div class="semester-tabs">
            <button
                :class="['tab', selectedYear === null && 'active']"
                @click="selectSemester(null, null)">
                전체
            </button>
            <button
                v-for="opt in semesterOptions"
                :key="`${opt.year}-${opt.semester}`"
                :class="['tab', selectedYear === opt.year && selectedSemester === opt.semester && 'active']"
                @click="selectSemester(opt.year, opt.semester)">
                {{ opt.year }}년 {{ opt.semester }}학기
            </button>
        </div>

        <!-- 성적 요약 -->
        <div class="summary-bar">
            <div class="summary-item">
                <p class="summary-label">평균 평점</p>
                <p class="summary-value">
                    {{ summary.averageGpa }}
                    <span v-if="summary.averageGpa !== '-'" class="unit"> / 4.5</span>
                </p>
            </div>
            <div class="summary-item">
                <p class="summary-label">환산 점수</p>
                <p class="summary-value">
                    {{ summary.convertedScore }}
                    <span v-if="summary.convertedScore !== '-'" class="unit">점</span>
                </p>
            </div>
            <div class="summary-item">
                <p class="summary-label">취득 학점</p>
                <p class="summary-value">
                    {{ summary.totalCredits }}<span class="unit">학점</span>
                </p>
            </div>
        </div>

        <!-- 성적 테이블 -->
        <DataTable
            :columns="['학년도', '학기', '구분', '교과목명', '학점', '등급', '평점']"
            :rows="filteredList"
            :isLoading="isLoading"
            gridCols="90px 70px 110px minmax(140px,1fr) 60px 80px 70px"
            emptyMessage="성적 데이터가 없습니다.">

            <article
                v-for="g in filteredList"
                :key="g.courseId"
                class="tbl-row">
                <div>{{ g.lectureYear }}</div>
                <div>{{ g.lectureSemester }}학기</div>
                <div>{{ g.lectureType }}</div>
                <div class="text-left">{{ g.lectureName }}</div>
                <div>{{ g.lectureCredit }}</div>
                <!-- 강의평가 미완료: 두 칸 병합 버튼 -->
                <template v-if="!g.evalCompleted">
                    <div class="eval-btn-cell">
                        <button class="btn-eval" @click="router.push('/evaluations')">강의평가하러가기</button>
                    </div>
                </template>
                <!-- 강의평가 완료: 등급 + 평점 정상 표시 -->
                <template v-else>
                    <div>
                        <span v-if="g.lectureGrade" class="grade-badge">{{ g.lectureGrade }}</span>
                        <span v-else class="no-grade">미입력</span>
                    </div>
                    <div>
                        <span v-if="g.lectureRating != null">{{ g.lectureRating.toFixed(2) }}</span>
                        <span v-else class="no-grade">-</span>
                    </div>
                </template>
            </article>
        </DataTable>

        <!-- 성적 상세보기 버튼 -->
        <div class="detail-btn-wrap">
            <button
                class="btn-detail"
                :disabled="!allEvalCompleted"
                @click="router.push('/grades/detail')">
                성적 상세보기 →
            </button>
            <p v-if="!allEvalCompleted && allGrades.length > 0" class="eval-notice">
                모든 강의평가를 완료해야 성적 상세보기가 가능합니다.
            </p>
        </div>

    </div>
</template>

<style scoped>
.grade-student-wrap { padding: 0; }

/* ── 학기 탭 ── */
.semester-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}
.tab {
    padding: 5px 14px;
    border: 1px solid var(--line-color);
    border-radius: 20px;
    background: #fff;
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    color: var(--font-color-light);
    transition: all 0.15s;
    &:hover { border-color: var(--main-color); color: var(--main-color); }
    &.active { background: var(--main-color); border-color: var(--main-color); color: #fff; font-weight: 700; }
}

/* ── 성적 요약 ── */
.summary-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}
.summary-item {
    flex: 1;
    background: var(--default-bg);
    border: 1px solid var(--line-color);
    border-radius: 8px;
    padding: 12px 16px;
    text-align: center;
}
.summary-label {
    font-size: var(--text-xs);
    color: var(--font-color-light);
    margin-bottom: 4px;
}
.summary-value {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--main-color);
}
.unit { font-size: var(--text-xs); font-weight: 400; color: var(--font-color-light); margin-left: 2px; }

/* 등급 가운데 정렬 */
.grade-badge {
    display: inline-block;
    width: 2.2em;
    text-align: center;
}

/* 상세보기 버튼 비활성 */
.btn-detail:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.eval-notice {
    margin-top: 8px;
    font-size: var(--text-xs);
    color: var(--font-color-light);
    text-align: right;
}

/* 강의평가 미완료: 두 칸 병합 버튼 셀 */
.eval-btn-cell {
    grid-column: span 2;
    display: flex;
    align-items: center;
    justify-content: center;
}
.btn-eval {
    padding: 5px 16px;
    background: var(--main-color);
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    &:hover { opacity: 0.85; }
}

/* ── 테이블 행 ── */
.tbl-row {
    display: grid;
    grid-template-columns: var(--grid-cols);
    align-items: stretch;
    background: #fff;
    border: 1px solid var(--table-border-color);
    border-top-width: 0;

    &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
    &:last-child     { border-radius: 0 0 5px 5px; }

    > div {
        padding: 12px 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }
}
.text-left { justify-content: flex-start !important; }

/* ── 성적 상세보기 버튼 ── */
.detail-btn-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}
.btn-detail {
    padding: 8px 18px;
    background: var(--main-color);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    &:hover { opacity: 0.88; }
}
</style>