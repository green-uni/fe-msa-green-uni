<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import { useModalStore } from '@/stores/modal'
import AnnouncementService from '@/services/announcementService'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const modal     = useModalStore()

const annoId    = computed(() => route.params.annoId)
const isEdit    = computed(() => !!annoId.value)
const isEditing = ref(false)
const isLoading = ref(false)

const form     = ref({ targetRole: 'STUDENT', title: '', content: '' })
const annoInfo = ref(null)
const originalForm = ref(null)

const targetRoleLabel = computed(() => {
    const map = { STUDENT: '학생', PROFESSOR: '교수', ALL: '전체공개' }
    return map[form.value.targetRole] ?? form.value.targetRole
})

const pageTitle = computed(() => {
    if (!isEdit.value)   return '공지사항 등록'
    if (isEditing.value) return '공지사항 수정'
    return '공지사항 상세'
})

const formatDate = (dateStr) => dateStr?.slice(0, 16).replace('T', ' ') ?? ''

onMounted(async () => {
    if (isEdit.value) {
        try {
            const detail = await AnnouncementService.getDetail(annoId.value)
            form.value.targetRole = detail.targetRole
            form.value.title      = detail.title
            form.value.content    = detail.content
            annoInfo.value        = detail
        } catch (e) {
            console.error(e)
        }
    }
})

const enterEditMode = () => {
    originalForm.value = { ...form.value }
    isEditing.value = true
}

const cancelEdit = () => {
    form.value = { ...originalForm.value }
    isEditing.value = false
}

const handleSubmit = async () => {
    if (!form.value.title.trim() || !form.value.content.trim()) {
        await modal.showAlert('제목과 내용을 입력해주세요.', 'warning')
        return
    }

    if (!isEditing.value) {
        const confirmed = await modal.showConfirm('공지사항을 등록하시겠습니까?', 'info')
        if (!confirmed) return
    }

    isLoading.value = true
    try {
        if (isEditing.value) {
            await AnnouncementService.update(annoId.value, {
                title:   form.value.title,
                content: form.value.content,
            })
            await modal.showAlert('공지사항이 수정되었습니다.', 'success')
            isEditing.value = false
        } else {
            await AnnouncementService.create({
                targetRole: form.value.targetRole,
                title:      form.value.title,
                content:    form.value.content,
                writerName: authStore.name,
            })
            await modal.showAlert('공지사항이 등록되었습니다.', 'success')
            router.push('/admin/announcements')
        }
    } catch (e) {
        console.error(e)
        await modal.showAlert('처리 중 오류가 발생했습니다.', 'error')
    } finally {
        isLoading.value = false
    }
}

const handleDelete = async () => {
    const confirmed = await modal.showConfirm('공지사항을 삭제하시겠습니까?', 'warning')
    if (!confirmed) return
    try {
        await AnnouncementService.remove(annoId.value)
        await modal.showAlert('공지사항이 삭제되었습니다.', 'success')
        router.push('/admin/announcements')
    } catch (e) {
        console.error(e)
        await modal.showAlert('처리 중 오류가 발생했습니다.', 'error')
    }
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
    </div>

    <!-- 상세 보기 (읽기 전용) -->
    <template v-if="isEdit && !isEditing">
      <div v-if="annoInfo" class="detail-card">
        <div class="card-header">
          <span class="badge">공지대상 : {{ targetRoleLabel }}</span>
          <h2>{{ form.title }}</h2>
          <div class="meta">
            <span>{{ annoInfo.writerName }}</span>
            <span>조회 {{ annoInfo.viewCount }}</span>
            <span>{{ formatDate(annoInfo.createdAt) }}</span>
          </div>
        </div>
        <div class="card-body">{{ form.content }}</div>
      </div>
      <div class="btn-row">
        <button type="button" class="btn-outline" @click="router.push('/admin/announcements')">목록으로</button>
        <button type="button" class="btn-danger" @click="handleDelete">삭제</button>
        <button type="button" class="btn-submit" @click="enterEditMode">수정</button>
      </div>
    </template>

    <!-- 등록 / 수정 폼 -->
    <form v-else class="form-wrap" @submit.prevent="handleSubmit">
      <div class="form-row">
        <label>대상</label>
        <select v-model="form.targetRole" :disabled="isEditing">
          <option value="STUDENT">학생</option>
          <option value="PROFESSOR">교수</option>
          <option value="ALL">전체공개</option>
        </select>
      </div>
      <div class="form-row">
        <label>제목</label>
        <input
          v-model="form.title"
          type="text"
          maxlength="50"
          placeholder="제목을 입력하세요 (최대 50자)"
        />
      </div>
      <div class="form-row align-top">
        <label>내용</label>
        <textarea
          v-model="form.content"
          rows="12"
          placeholder="내용을 입력하세요"
        />
      </div>
      <div class="btn-row">
        <button type="button" class="btn-outline" @click="isEditing ? cancelEdit() : router.back()">취소</button>
        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isEditing ? '확인' : '등록' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { display: flex; flex-direction: column; gap: 16px; }
.page-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }

.detail-card {
  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;
  background: #fff;
}
.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
  h2 { font-size: 1.05rem; font-weight: 700; margin: 8px 0 10px; color: #1a1a1a; }
  .meta {
    display: flex; gap: 6px; align-items: center;
    font-size: 0.8rem; color: #999;
    span + span::before { content: '·'; margin-right: 6px; }
  }
}
.badge {
  display: inline-block; font-size: 0.75rem; padding: 2px 10px;
  background: #e8f4ee; color: #2d8659;
  border-radius: 10px; font-weight: 600;
}
.card-body {
  padding: 24px; min-height: 200px;
  font-size: 0.875rem; line-height: 1.8; color: #333;
  white-space: pre-wrap; word-break: break-word;
}

.form-wrap { display: flex; flex-direction: column; gap: 16px; }
.form-row {
  display: flex; align-items: center; gap: 16px;
  &.align-top { align-items: flex-start; }
  label { width: 60px; font-size: 0.875rem; font-weight: 600; flex-shrink: 0; }
  select, input, textarea {
    flex: 1; padding: 8px 12px;
    border: 1px solid #ddd; border-radius: 6px;
    font-size: 0.875rem; font-family: inherit;
    &:focus { outline: none; border-color: #2d8659; }
  }
  textarea { resize: vertical; line-height: 1.6; }
  select:disabled { background: #f5f5f5; color: #888; }
}

.btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-outline {
  padding: 8px 20px; border: 1px solid #ccc; border-radius: 6px;
  background: #fff; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #f5f5f5; }
}
.btn-submit {
  padding: 8px 20px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:disabled { background: #aaa; cursor: not-allowed; }
  &:not(:disabled):hover { background: #246b47; }
}
.btn-danger {
  padding: 8px 20px; background: #e53935; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #c62828; }
}
</style>