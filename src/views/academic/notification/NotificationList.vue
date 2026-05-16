<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import NotificationService from '@/services/notificationService'

const router = useRouter()

const state = reactive({
  isLoading: false,
})

const loadNotifications = async () => {
  state.isLoading = true
  try {
    const [list, count] = await Promise.all([
      NotificationService.getList({ page: 1, size: 30 }),
      NotificationService.getUnreadCount(),
    ])
    NotificationService.notifications.value = list
    NotificationService.unreadCount.value = count
  } catch (e) {
    console.error(e)
  } finally {
    state.isLoading = false
  }
}

const handleClick = async (noti) => {
  if (!noti.isRead) {
    try {
      await NotificationService.readOne(noti.notiId)
      noti.isRead = true
      if (NotificationService.unreadCount.value > 0) NotificationService.unreadCount.value--
    } catch (e) {
      console.error(e)
    }
  }
  if (noti.url) {
    NotificationService.isPanelOpen.value = false
    router.push(noti.url)
  }
}

const readAll = async () => {
  try {
    await NotificationService.readAll()
    NotificationService.notifications.value.forEach((n) => (n.isRead = true))
    NotificationService.unreadCount.value = 0
  } catch (e) {
    console.error(e)
  }
}

const deleteOne = async (e, notiId) => {
  e.stopPropagation()
  try {
    await NotificationService.deleteOne(notiId)
    const idx = NotificationService.notifications.value.findIndex((n) => n.notiId === notiId)
    if (idx !== -1) {
      if (!NotificationService.notifications.value[idx].isRead && NotificationService.unreadCount.value > 0)
        NotificationService.unreadCount.value--
      NotificationService.notifications.value.splice(idx, 1)
    }
  } catch (e) {
    console.error(e)
  }
}

const deleteAll = async () => {
  try {
    await NotificationService.deleteAll()
    NotificationService.notifications.value = []
    NotificationService.unreadCount.value = 0
  } catch (e) {
    console.error(e)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  return `${d.getMonth() + 1}.${d.getDate()}`
}

onMounted(loadNotifications)
</script>

<template>
  <div class="noti-wrap">
    <div class="noti-header">
      <span class="noti-title">알림</span>
      <div class="noti-actions">
        <button v-if="NotificationService.unreadCount.value > 0" class="btn-text" @click="readAll">
          전체 읽음
        </button>
        <button v-if="NotificationService.notifications.value.length > 0" class="btn-text" @click="deleteAll">
          전체 삭제
        </button>
        <button class="btn-close" @click="NotificationService.isPanelOpen.value = false">
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </button>
      </div>
    </div>

    <div class="noti-body">
      <div v-if="state.isLoading" class="noti-empty">불러오는 중...</div>

      <div v-else-if="NotificationService.notifications.value.length === 0" class="noti-empty">
        알림이 없습니다.
      </div>

      <ul v-else>
        <li
          v-for="noti in NotificationService.notifications.value"
          :key="noti.notiId"
          class="noti-item"
          :class="{ unread: !noti.isRead }"
          @click="handleClick(noti)"
        >
          <div class="noti-dot" v-if="!noti.isRead" />
          <div class="noti-content">
            <p class="noti-message">{{ noti.message }}</p>
            <span class="noti-date">{{ formatDate(noti.createdAt) }}</span>
          </div>
          <button class="btn-delete" @click="(e) => deleteOne(e, noti.notiId)">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.noti-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.noti-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;

  .noti-title { font-weight: 600; font-size: 1rem; }
  .noti-actions { display: flex; align-items: center; gap: 10px; }
}

.btn-text {
  background: none; border: none; font-size: 0.78rem;
  color: #888; cursor: pointer; padding: 0;
  &:hover { color: #333; }
}

.btn-close {
  background: none; border: none; color: #aaa;
  font-size: 1rem; cursor: pointer; padding: 2px 4px;
  &:hover { color: #333; }
}

.noti-body { flex: 1; overflow-y: auto; }

.noti-empty {
  padding: 60px 16px; text-align: center;
  color: #aaa; font-size: 0.875rem;
}

ul { list-style: none; margin: 0; padding: 0; }

.noti-item {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;

  &:last-child { border-bottom: none; }
  &:hover { background: #f9f9f9; }
  &.unread { background: #f0f5ff; }
}

.noti-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #4a7cf7; flex-shrink: 0;
}

.noti-content {
  flex: 1; min-width: 0;

  .noti-message {
    font-size: 0.875rem; line-height: 1.4;
    margin: 0 0 4px; word-break: keep-all;
  }
  .noti-date { font-size: 0.75rem; color: #aaa; }
}

.btn-delete {
  background: none; border: none; color: #ccc;
  cursor: pointer; padding: 2px 6px; flex-shrink: 0;
  &:hover { color: #999; }
}
</style>
