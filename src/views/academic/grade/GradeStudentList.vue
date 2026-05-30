<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
// import GradeService from '@/services/gradeService' // TODO: 목 데이터 제거 시 주석 해제

const router = useRouter()

const isLoading = ref(false)
const grades    = ref([])

const now = new Date()
const filter = reactive({
    year:     now.getFullYear(),
    semester: now.getMonth() + 1 <= 6 ? 1 : 2,
})

const summary = computed(() => {
    const graded = grades.value.filter(g => g.lectureRating != null)
    if (!graded.length) return { averageGpa: '-', convertedScore: '-', totalCredits: 0 }

    const sumWeighted  = graded.reduce((acc, g) => acc + g.lectureRating * g.lectureCredit, 0)
    const sumCredits   = graded.reduce((acc, g) => acc + g.lectureCredit, 0)
    const avg          = sumCredits > 0 ? Math.round(sumWeighted / sumCredits * 100) / 100 : 0
    const totalCredits = graded.reduce((acc, g) => acc + g.lectureCredit, 0)

    return {
        averageGpa:     avg.toFixed(2),
        convertedScore: Math.round(avg / 4.5 * 100),
        totalCredits,
    }
})

const allEvalCompleted = computed(() =>
    grades.value.length > 0 && grades.value.every(g => g.evalCompleted)
)

// TODO: 목 데이터 — 확인 후 제거
const MOCK_GRADES = [
    { courseId: 1, lectureYear: 2026, lectureSemester: 1, lectureType: '교양필수', lectureName: '글쓰기와 소통',   lectureCredit: 2, evalCompleted: false },
    { courseId: 2, lectureYear: 2026, lectureSemester: 1, lectureType: '전공필수', lectureName: '자료구조',        lectureCredit: 3, evalCompleted: true,  lectureGrade: 'A+', lectureRating: 4.5 },
    { courseId: 3, lectureYear: 2026, lectureSemester: 1, lectureType: '전공필수', lectureName: '알고리즘',        lectureCredit: 3, evalCompleted: true,  lectureGrade: 'B+', lectureRating: 3.5 },
    { courseId: 4, lectureYear: 2026, lectureSemester: 1, lectureType: '전공선택', lectureName: '데이터베이스 설계', lectureCredit: 3, evalCompleted: true,  lectureGrade: null, lectureRating: null },
    { courseId: 5, lectureYear: 2026, lectureSemester: 1, lectureType: '교양선택', lectureName: '영어회화 기초',   lectureCredit: 2, evalCompleted: false },
]

const fetchGrades = async () => {
    isLoading.value = true
    try {
        // TODO: 목 데이터 — 확인 후 실제 API로 교체
        grades.value = MOCK_GRADES
        // const res   = await GradeService.getStudentGrades(filter.year, filter.semester)
        // grades.value = res.gradeList ?? []
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchGrades)
</script>

<template>
    <div style="position: relative">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

        <FilterBar :hasFilter="false" :showSearch="false">
            <div class="filter-item">
                <div class="input-label">학년도</div>
                <div class="input-content">
                    <input v-model.number="filter.year" type="number" min="2000" max="2099" @change="fetchGrades" />
                </div>
            </div>
            <div class="filter-item">
                <div class="input-label">학기</div>
                <div class="input-content">
                    <select v-model.number="filter.semester" @change="fetchGrades">
                        <option :value="1">1학기</option>
                        <option :value="2">2학기</option>
                    </select>
                </div>
            </div>
        </FilterBar>

        <!-- 성적 요약 -->
        <div class="summary-bar">
            <div class="summary-item">
                <p class="summary-label">평균 평점</p>
                <p class="summary-value">
                    {{ summary.averageGpa }}
                    <span v-if="summary.averageGpa !== '-'" class="summary-unit"> / 4.5</span>
                </p>
            </div>
            <div class="summary-item">
                <p class="summary-label">환산 점수</p>
                <p class="summary-value">
                    {{ summary.convertedScore }}
                    <span v-if="summary.convertedScore !== '-'" class="summary-unit">점</span>
                </p>
            </div>
            <div class="summary-item">
                <p class="summary-label">취득 학점</p>
                <p class="summary-value">
                    {{ summary.totalCredits }}<span class="summary-unit">학점</span>
                </p>
            </div>
        </div>

        <!-- 성적 테이블 -->
        <DataTable
            :columns="['학년도', '학기', '구분', '교과목명', '학점', '등급', '평점']"
            :rows="grades"
            :isLoading="isLoading"
            gridCols="90px 70px 110px minmax(140px,1fr) 60px 80px 70px"
            emptyMessage="성적 데이터가 없습니다.">

            <article
                v-for="g in grades"
                :key="g.courseId"
                class="tbl-row">
                <div>{{ g.lectureYear }}</div>
                <div>{{ g.lectureSemester }}학기</div>
                <div>{{ g.lectureType }}</div>
                <div class="tal">{{ g.lectureName }}</div>
                <div>{{ g.lectureCredit }}</div>

                <!-- 강의평가 미완료: 2칸 병합 버튼 -->
                <template v-if="!g.evalCompleted">
                    <div class="eval-btn-cell">
                        <button class="btn btn-submit btn-sm" @click="router.push('/evaluations')">
                            강의평가하러가기
                        </button>
                    </div>
                </template>
                <!-- 강의평가 완료: 등급 + 평점 -->
                <template v-else>
                    <div>{{ g.lectureGrade || '-' }}</div>
                    <div>
                        <span v-if="g.lectureRating != null">{{ g.lectureRating.toFixed(2) }}</span>
                        <span v-else class="no-data">-</span>
                    </div>
                </template>
            </article>
        </DataTable>

        <div class="page-footer">
            <p v-if="!allEvalCompleted && grades.length > 0" class="notice-caution">
                모든 강의평가를 완료해야 성적 상세보기가 가능합니다.
            </p>
            <button
                class="btn btn-submit"
                :disabled="!allEvalCompleted"
                @click="router.push('/grades/detail')">
                성적 상세보기 →
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.eval-btn-cell { grid-column: span 2; padding-top: 6px !important; }
</style>
