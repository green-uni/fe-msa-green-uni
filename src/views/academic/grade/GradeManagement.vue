<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import SearchInput from '@/components/util/SearchInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import GradeService from '@/services/gradeService'
import LectureService from '@/services/lectureService'
import { useRoute, useRouter } from 'vue-router'
import { useModalStore } from '@/stores/modal'

const route = useRoute()
const router = useRouter()
const modal = useModalStore()
const lectureId = route.params.lectureId

const searchInput = ref('')
const isEditMode = ref(false)
const currentPage = ref(1)
const pageSize = 10

const lectureInfo = reactive({
    lectureName: '',
    year: '',
    semester: '',
    lectureType: '',
    credit: '',
    academicYear: '',
    maxStd: 0,
    studentCount: 0,
})

const state = reactive({
    gradeList: [],
    isLoading: false,
})

const GRADE_KEY = `grade_${lectureId}`

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

const loadGrades = async () => {
    state.isLoading = true
    try {
        const res = await GradeService.getGradeList(lectureId)
        const calcList = (res ?? []).map(s => ({
            ...s,
            total_score: calcTotalScore(s.mid_score, s.fin_score, s.assignment_score, s.attend_score),
            grade_letter: s.grade_letter ?? calcGradeLetter(
                calcTotalScore(s.mid_score, s.fin_score, s.assignment_score, s.attend_score)
            ),
        }))

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

const saveDraft = () => localStorage.setItem(GRADE_KEY, JSON.stringify(state.gradeList))

const calcGrade = (student) => {
    student.mid_score = Math.min(100, Math.max(0, Number(student.mid_score) || 0))
    student.fin_score = Math.min(100, Math.max(0, Number(student.fin_score) || 0))
    student.assignment_score = Math.min(100, Math.max(0, Number(student.assignment_score) || 0))
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
        await loadGrades()
    } catch {
        await modal.showAlert('성적 저장에 실패했습니다.', 'error')
    }
}

const goToPage = (page) => { currentPage.value = page }

onMounted(async () => {
    await loadGrades()
    try {
        const data = await LectureService.getLectureDetail(lectureId)
        const d = Array.isArray(data) && data.length > 0 ? data[0] : data
        lectureInfo.lectureName  = d?.lectureName  ?? ''
        lectureInfo.year         = d?.year         ?? ''
        lectureInfo.semester     = d?.semester     ?? ''
        lectureInfo.lectureType  = d?.lectureType  ?? ''
        lectureInfo.credit       = d?.credit       ?? ''
        lectureInfo.academicYear = d?.academicYear ?? ''
        lectureInfo.maxStd       = d?.maxStd       ?? 0
    } catch {
        // 강의 정보 조회 실패 무시
    }
})
</script>

<template>
    <div style="position: relative">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

        <!-- 강의 정보 + 검색 -->
        <div class="card">
            <div class="card-label">
                <span>{{ lectureInfo.lectureName || '성적 관리' }}</span>
                <div class="d-flex g5 ai-center">
                    <SearchInput
                        v-model="searchInput"
                        :list="state.gradeList"
                        placeholder="이름, 학번 검색"
                        @update:modelValue="currentPage = 1"
                    />
                    <button class="btn btn-submit">
                        <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
                    </button>
                </div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-key">학년도 / 학기</span>
                    <span class="info-val">
                        {{ lectureInfo.year ? `${lectureInfo.year}년 ${lectureInfo.semester}학기` : '-' }}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-key">이수구분</span>
                    <span class="info-val">{{ lectureInfo.lectureType || '-' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-key">이수학점</span>
                    <span class="info-val">{{ lectureInfo.credit ? `${lectureInfo.credit}학점` : '-' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-key">대상학년</span>
                    <span class="info-val">{{ lectureInfo.academicYear ? `${lectureInfo.academicYear}학년` : '-' }}</span>
                </div>
                <div class="info-item">
                    <span class="info-key">수강인원</span>
                    <span class="info-val">{{ lectureInfo.studentCount }}명</span>
                </div>
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
                    :class="{ 'edit-row': isEditMode }"
                    v-for="(student, idx) in pagedList"
                    :key="student.courseId ?? idx">

                    <div>{{ student.studentCode }}</div>
                    <div>{{ student.memberName }}</div>
                    <div>{{ student.academic_year ?? '-' }}</div>

                    <template v-if="!isEditMode">
                        <div>{{ student.mid_score }}</div>
                        <div>{{ student.fin_score }}</div>
                        <div>{{ student.assignment_score }}</div>
                        <div class="attend-score">{{ student.attend_score }}</div>
                    </template>

                    <template v-else>
                        <div>
                            <input class="tbl-input score-input" type="number" v-model="student.mid_score"
                                min="0" max="100" @input="calcGrade(student)" />
                        </div>
                        <div>
                            <input class="tbl-input score-input" type="number" v-model="student.fin_score"
                                min="0" max="100" @input="calcGrade(student)" />
                        </div>
                        <div>
                            <input class="tbl-input score-input" type="number" v-model="student.assignment_score"
                                min="0" max="100" @input="calcGrade(student)" />
                        </div>
                        <div class="attend-score">{{ student.attend_score }}</div>
                    </template>

                    <div>{{ student.total_score }}</div>
                    <div>{{ student.grade_letter || '-' }}</div>
                </article>
            </DataTable>

            <Pagination
                :currentPage="currentPage"
                :maxPage="maxPage"
                :pageGroupSize="10"
                @goToPage="goToPage"
            />

        <div class="page-footer">
            <button class="btn btn-default" @click="router.back()">← 뒤로</button>
            <div class="action-group">
                <button v-if="!isEditMode" class="btn btn-default" @click="startEditMode">수정</button>
                <button v-else class="btn btn-submit" @click="saveGrades">저장</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.score-input { width: 66px; text-align: center; }
.attend-score { color: $font-color-light; }
</style>
