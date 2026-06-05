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
    const map = { STUDENT: '학생', PROFESSOR: '교수', MEMBER: '교내 전체', ALL: '전체공개' }
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
            const detail = await AnnouncementService.getAdminDetail(annoId.value)
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
  <div class="detail-wrap">

    <!-- 상세 보기 (읽기 전용) -->
    <template v-if="isEdit && !isEditing">
      <div v-if="annoInfo" class="post-card">
        <div class="post-header">
          <h2>{{ form.title }}</h2>
          <div class="post-meta">
            <span>{{ annoInfo.writerName }} ({{ annoInfo.writerCode }})</span>
            <span>조회 {{ annoInfo.viewCount }}</span>
            <span>{{ formatDate(annoInfo.createdAt) }}</span>
            <span>대상 : {{ targetRoleLabel }}</span>
          </div>
        </div>
        <div class="post-body">{{ form.content }}</div>
      </div>
      <div class="page-footer">
        <button type="button" class="btn btn-default" @click="router.push('/admin/announcements')">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <div class="action-group">
          <button type="button" class="btn btn-default" @click="handleDelete">
            <font-awesome-icon icon="fa-solid fa-trash" /> 삭제
          </button>
          <button type="button" class="btn btn-default" @click="enterEditMode">
            <font-awesome-icon icon="fa-solid fa-pen" /> 수정
          </button>
        </div>
      </div>
    </template>

    <!-- 등록 / 수정 폼 -->
    <template v-else>
      <div class="form-wrap">
        <div class="content-wrap">
          <h3>{{ pageTitle }}</h3>
          <div class="form-grid" style="--grid-cols: 1fr; row-gap: 20px;">

            <div class="input-wrap">
              <div class="input-label">대상</div>
              <div class="input-content">
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" v-model="form.targetRole" value="STUDENT" :disabled="isEditing" /> 학생
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="form.targetRole" value="PROFESSOR" :disabled="isEditing" /> 교수
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="form.targetRole" value="MEMBER" :disabled="isEditing" /> 교내 전체
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="form.targetRole" value="ALL" :disabled="isEditing" /> 전체공개
                  </label>
                </div>
              </div>
            </div>

            <div class="input-wrap">
              <div class="input-label">제목</div>
              <div class="input-content">
                <input
                  v-model="form.title"
                  type="text"
                  maxlength="50"
                  placeholder="제목을 입력하세요 (최대 50자)"
                />
              </div>
            </div>

            <div class="input-wrap input-grid-full">
              <div class="input-label">내용</div>
              <div class="input-content">
                <textarea
                  v-model="form.content"
                  rows="12"
                  placeholder="내용을 입력하세요"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="page-footer">
        <button type="button" class="btn btn-default" @click="isEditing ? cancelEdit() : router.back()">
          <font-awesome-icon icon="fa-solid fa-arrow-left" /> 취소
        </button>
        <div class="action-group">
          <button type="button" class="btn btn-submit" :disabled="isLoading" @click="handleSubmit">
            <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isEditing ? '확인' : '등록' }}
          </button>
        </div>
      </div>
    </template>

  </div>
</template>

