import axios from '@/services/httpRequester'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref } from 'vue'

// 모듈 레벨 싱글톤 상태 — 컴포넌트 어디서든 import해서 공유
const notifications = ref([])
const unreadCount = ref(0)
const isPanelOpen = ref(false)
let stompClient = null

function addIfNew(noti) {
  if (!notifications.value.some((n) => n.notiId === noti.notiId)) {
    notifications.value.unshift({ ...noti, isRead: false })
    unreadCount.value++
  }
}

const NotificationService = {
  // ── REST ───────────────────────────────────────────
  async getList(params = { page: 1, size: 20 }) {
    const res = await axios.get('/academic/notifications', { params })
    return res.data.data ?? []
  },

  async getUnreadCount() {
    const res = await axios.get('/academic/notifications/unread-count')
    return res.data.data?.unreadCount ?? 0
  },

  async readOne(notiId) {
    await axios.post(`/academic/notifications/${notiId}/read`)
  },

  async readAll() {
    await axios.post('/academic/notifications/read-all')
  },

  async deleteOne(notiId) {
    await axios.delete(`/academic/notifications/${notiId}`)
  },

  async deleteAll() {
    await axios.delete('/academic/notifications')
  },

  // ── WebSocket ──────────────────────────────────────
  connect(role) {
    if (stompClient?.active) return

    stompClient = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_API_BASE_URL}/academic/ws`, null, {
          transports: ['xhr-polling'],
        }),
      reconnectDelay: 5000,
      onConnect: () => {
        // 개인 알림
        stompClient.subscribe('/user/queue/notifications', (msg) => {
          addIfNew(JSON.parse(msg.body))
        })
        // 역할 공통 알림 (STUDENT / PROFESSOR)
        if (role === 'STUDENT' || role === 'PROFESSOR' || role === 'ADMIN') {
          stompClient.subscribe(`/topic/${role}`, (msg) => {
            addIfNew(JSON.parse(msg.body))
          })
        }
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    })

    stompClient.activate()
  },

  disconnect() {
    stompClient?.deactivate()
    stompClient = null
    notifications.value = []
    unreadCount.value = 0
  },

  // ── 공유 상태 ──────────────────────────────────────
  notifications,
  unreadCount,
  isPanelOpen,
}

export default NotificationService
