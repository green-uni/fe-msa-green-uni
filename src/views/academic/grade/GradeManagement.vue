<script setup>
// 1. 라이브러리
import { ref, reactive, computed, onMounted } from 'vue'
// 2. 컴포넌트
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import SearchInput from '@/components/util/SearchInput.vue'
// 3. 서비스
import GradeService from '@/services/gradeService'
import LectureService from '@/services/lectureService'
// 4. 라우터 / 스토어
import { useRoute, useRouter } from 'vue-router'
import { useModalStore } from '@/stores/modal'

const route = useRoute()
const router = useRouter()
const modal = useModalStore()
const lectureId = route.params.lectureId

// 5. 상태값
const searchInput = ref('')
const isEditMode = ref(false)
const currentPage = ref(1)
const pageSize = 10

const lectureInfo = reactive({
    lectureName: '',
    studentCount: 0,
})

const state = reactive({
    gradeList: [],
    isLoading: false,
})

// 6. localStorage 키
const GRADE_KEY = `grade_${lectureId}`

// 7. computed
const filteredList = computed(() => {
    if (!searchInput.value) return state.gradeList
    const keyword = searchInput.value.toLowerCase()
    return state.gradeList.filter(s =>
        s.memberName?.toLowerCase().includes(keyword) ||
        s.studentCode?.toString().includes(keyword)
    )
})

const pagedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredList.value.slice(start, start + pageSize)
})

const maxPage = computed(() =>
    Math.ceil(filteredList.value.length / pageSize) || 1
)

// 등급 뱃지 CSS 클래스 (A+, B+ 등 특수문자 처리)
const gradeClass = (letter) => {
    if (!letter) return ''
    return 'grade-' + letter.replace('+', 'plus').toLowerCase()
}

// 8. 총점·등급 미리보기 계산 (편집 시 실시간)
// mid30% + fin30% + assignment20% + attend20%
const calcTotalScore = (mid, fin, assignment, attend) =>
    Math.round(mid * 0.3 + fin * 0.3 + assignment * 0.2 + attend * 0.2)

const calcGradeLetter = (total) => {
    if (total >= 95) return 'A+'
    if (total >= 90) return 'A'
    if (total >= 85) return 'B+'
    if (total >= 80) return 'B'
    if (total >= 75) return 'C+'
    if (total >= 70) return 'C'
    if (total >= 65) return 'D+'
    if (total >= 60) return 'D'
    return 'F'
}

// 9. API 호출 함수
const loadGrades = async () => {
    state.isLoading = true
    try {
        const res = await GradeService.getGradeList(lectureId)
        // 서버 데이터 기반으로 총점·등급 미리 계산 후 상태 세팅
        const calcList = (res ?? []).map(s => ({
            ...s,
            total_score: calcTotalScore(s.mid_score, s.fin_score, s.assignment_score, s.attend_score),
            grade_letter: s.grade_letter ?? calcGradeLetter(
                calcTotalScore(s.mid_score, s.fin_score, s.assignment_score, s.attend_score)
            ),
        }))

        // localStorage 임시저장 복원 여부 확인
        const draft = localStorage.getItem(GRADE_KEY)
        if (draft) {
            const confirm = await modal.showConfirm('이전에 수정 중이던 성적을 불러오시겠습니까?', 'info')
            if (confirm) {
                const draftList = JSON.parse(draft)
                state.gradeList = calcList.map(s => {
                    const saved = draftList.find(d => d.courseId === s.courseId)
                    return saved ? { ...s,
                        mid_score: saved.mid_score,
                        fin_score: saved.fin_score,
                        assignment_score: saved.assignment_score,
                        total_score: saved.total_score,
                        grade_letter: saved.grade_letter,
                    } : s
                })
                isEditMode.value = true
            } else {
                localStorage.removeItem(GRADE_KEY)
                state.gradeList = calcList
            }
        } else {
            state.gradeList = calcList
        }

        lectureInfo.studentCount = state.gradeList.length
    } catch {
        await modal.showAlert('성적 조회에 실패했습니다.', 'error')
    } finally {
        state.isLoading = false
    }
}

// 10. 이벤트 핸들러
const saveDraft = () => localStorage.setItem(GRADE_KEY, JSON.stringify(state.gradeList))

const calcGrade = (student) => {
    // 0~100 범위 강제
    student.mid_score = Math.min(100, Math.max(0, Number(student.mid_score) || 0))
    student.fin_score = Math.min(100, Math.max(0, Number(student.fin_score) || 0))
    student.assignment_score = Math.min(100, Math.max(0, Number(student.assignment_score) || 0))

    // 총점·등급 실시간 미리보기 (출석점수는 서버 데이터 그대로)
    student.total_score = calcTotalScore(
        student.mid_score, student.fin_score,
        student.assignment_score, student.attend_score
    )
    student.grade_letter = calcGradeLetter(student.total_score)
    saveDraft()
}

const startEditMode = () => { isEditMode.value = true }

const saveGrades = async () => {
    const confirm = await modal.showConfirm('성적을 저장하시겠습니까?', 'info')
    if (!confirm) return
    try {
        // 서버 요청은 camelCase (GradeUpdateReq)
        const reqList = state.gradeList.map(s => ({
            courseId: s.courseId,
            midScore: s.mid_score,
            finScore: s.fin_score,
            assignmentScore: s.assignment_score,
        }))
        await GradeService.updateGrades(lectureId, reqList)
        localStorage.removeItem(GRADE_KEY)
        await modal.showAlert('성적이 저장되었습니다.', 'success')
        isEditMode.value = false
        await loadGrades() // 저장 후 서버 최신 데이터 재조회
    } catch {
        await modal.showAlert('성적 저장에 실패했습니다.', 'error')
    }
}

const goToPage = (page) => { currentPage.value = page }

// 11. onMounted
onMounted(async () => {
    await loadGrades()
    try {
        const data = await LectureService.getLectureDetail(lectureId)
        lectureInfo.lectureName = data?.lectureName ?? ''
    } catch {
        // 강의 정보 조회 실패 시 무시
    }
})
</script>

<template>
    <div class="grade-wrap">
        <!-- 상단 헤더 -->
        <div class="header-section">
            <div class="table-header">
                <span class="lecture-name">{{ lectureInfo.lectureName }}</span>
                <span class="student-count">수강 인원: {{ lectureInfo.studentCount }}명</span>
            </div>
            <div class="search-area">
                <SearchInput
                    v-model="searchInput"
                    :list="state.gradeList"
                    placeholder="이름, 학번 검색"
                    @update:modelValue="currentPage = 1"
                />
            </div>
        </div>

        <!-- 성적 테이블 -->
        <DataTable
            :columns="['학번', '성명', '학년', '중간평가', '기말평가', '과제점수', '출석점수', '총점', '최종등급']"
            :rows="pagedList"
            :isLoading="state.isLoading"
            gridCols="1.2fr 1fr 60px 1fr 1fr 1fr 1fr 80px 90px"
            emptyMessage="수강 학생이 없습니다.">

            <article
                class="tbl-row no-hover"
                v-for="(student, idx) in pagedList"
                :key="student.courseId ?? idx">

                <div>{{ student.studentCode }}</div>
                <div>{{ student.memberName }}</div>
                <div>{{ student.academic_year ?? '-' }}</div>

                <!-- 조회 모드 -->
                <template v-if="!isEditMode">
                    <div>{{ student.mid_score }}</div>
                    <div>{{ student.fin_score }}</div>
                    <div>{{ student.assignment_score }}</div>
                    <div>{{ student.attend_score }}</div>
                </template>

                <!-- 편집 모드 -->
                <template v-else>
                    <div>
                        <input class="score-input" type="number" v-model="student.mid_score"
                            min="0" max="100" @input="calcGrade(student)" />
                    </div>
                    <div>
                        <input class="score-input" type="number" v-model="student.fin_score"
                            min="0" max="100" @input="calcGrade(student)" />
                    </div>
                    <div>
                        <input class="score-input" type="number" v-model="student.assignment_score"
                            min="0" max="100" @input="calcGrade(student)" />
                    </div>
                    <!-- 출석 점수는 서버 자동 계산 — 수정 불가 -->
                    <div class="attend-score">{{ student.attend_score }}</div>
                </template>

                <div>{{ student.total_score }}</div>
                <div>
                    <span>{{ student.grade_letter || '-' }}</span>
                </div>
            </article>
        </DataTable>

        <!-- 하단 버튼 -->
        <div class="footer-section">
            <Pagination
                :currentPage="currentPage"
                :maxPage="maxPage"
                :pageGroupSize="10"
                @goToPage="goToPage"
            />
            <div class="btn-group">
                <button class="btn btn-default" @click="router.back()">← 뒤로</button>
                <button v-if="!isEditMode" class="btn btn-default" @click="startEditMode">수정</button>
                <button v-else class="btn btn-submit" @click="saveGrades">저장</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grade-wrap { padding: 0; }

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.table-header { display: flex; align-items: flex-end; gap: 10px; }
.lecture-name { font-size: 1.4rem; font-weight: 700; }
.student-count { padding: 0 6px; color: var(--font-color-light); }

.search-area { display: flex; align-items: center; gap: 8px; }

.score-input {
    width: 66px; padding: 4px 6px;
    border: 1px solid #ccc; border-radius: 4px;
    text-align: center; font-size: 14px;
}

/* 출석 점수 — 수정 불가 표시 */
.attend-score { color: var(--font-color-light); font-size: 14px; }

.footer-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
}
.btn-group { display: flex; gap: 8px; }
</style>