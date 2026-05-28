<script setup>
// 1. 라이브러리
import { ref, onMounted } from 'vue'
// 2. 컴포넌트
import DataTable from '@/components/common/DataTable.vue'
// 3. 서비스
// [수정] 팀원 강의 API 의존 제거 → 성적 도메인 자체 API 사용 (GET /professor/grades/lectures)
import GradeService from '@/services/gradeService'
// 4. 라우터
import { useRouter } from 'vue-router'

const router = useRouter()

// 5. 상태값
const lectures = ref([])
const isLoading = ref(true)

// 11. onMounted
onMounted(async () => {
    try {
        lectures.value = await GradeService.getProfessorLectures()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="prof-grade-page">
        <DataTable
            :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '관리']"
            :rows="lectures"
            gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(140px,1.4fr) minmax(110px,1fr) minmax(120px,1fr)"
            :isLoading="isLoading"
            emptyMessage="담당 중인 강의가 없습니다.">

            <article
                v-for="lecture in lectures"
                :key="lecture.lectureId"
                class="tbl-row">
                <div>{{ lecture.lectureName }}</div>
                <div><span class="type-badge">{{ lecture.lectureType }}</span></div>
                <div>{{ lecture.year }}년 {{ lecture.semester }}학기</div>
                <div>{{ lecture.credit }}학점 / {{ lecture.academicYear }}학년</div>
                <div class="action-cell">
                    <button class="btn btn-submit"
                        @click.stop="router.push(`/professor/grades/${lecture.lectureId}`)">
                        성적 관리
                    </button>
                </div>
            </article>
        </DataTable>
    </div>
</template>

<style scoped lang="scss">
.prof-grade-page {
    width: 100%;
    overflow-x: auto;
}

.type-badge {
    position: static;
    display: inline-block;
    background: var(--main-color);
    color: #fff;
    font-size: var(--text-xs);
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
}

.action-cell {
    display: flex;
    gap: 6px;
    justify-content: center;
}

.btn {
    font-size: var(--text-xs);
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
}
.btn-submit {
    background: var(--main-color);
    color: #fff;
    border: 1px solid var(--main-color);
    &:hover { filter: brightness(1.1); }
}

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
    }
}
</style>