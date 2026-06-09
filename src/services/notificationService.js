import axios from '@/services/httpRequester'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authentication'

// 모듈 레벨 싱글톤 상태 — 컴포넌트 어디서든 import해서 공유
const notifications = ref([])
const unreadCount = ref(0)
const isPanelOpen = ref(false)
let stompClient = null
let onBannerRefresh = null
let countPollTimer = null

async function addIfNew(noti) {
  if (!notifications.value.some((n) => n.notiId === noti.notiId)) {
    notifications.value.unshift({ ...noti, isRead: false })
    if (noti.unreadCount != null) {
      // 개인 알림: 백엔드가 정확한 미읽음 수를 전달
      unreadCount.value = noti.unreadCount
    } else {
      // 역할 알림: 수신자마다 카운트가 달라 REST에서 재조회
      try {
        const res = await axios.get('/academic/notifications/unread-count')
        unreadCount.value = res.data.data?.unreadCount ?? unreadCount.value + 1
      } catch {
        unreadCount.value++
      }
    }
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

  // ── 폴링 ──────────────────────────────────────────
  startCountPolling() {
    if (countPollTimer) return
    countPollTimer = setInterval(async () => {
      if (!useAuthStore().isLogin) return
      try {
        const res = await axios.get('/academic/notifications/unread-count')
        unreadCount.value = res.data.data?.unreadCount ?? 0
      } catch {
        // silent
      }
    }, 15000)
  },

  stopCountPolling() {
    if (countPollTimer) {
      clearInterval(countPollTimer)
      countPollTimer = null
    }
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
      beforeConnect: () => {
        if (!useAuthStore().isLogin) {
          stompClient?.deactivate()
        }
      },
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
        // 배너 실시간 갱신
        stompClient.subscribe('/topic/banner', () => {
          if (onBannerRefresh) onBannerRefresh()
        })
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    })

    stompClient.activate()
    NotificationService.startCountPolling()
  },

  // disconnect() {
  //   stompClient?.deactivate()
  //   stompClient = null
  //   notifications.value = []
  //   unreadCount.value = 0
  // },

disconnect() {
  NotificationService.stopCountPolling()
  try {
    stompClient?.deactivate()
  } catch (e) {
    // 로그아웃 시 401 무시
  }
  stompClient = null
  notifications.value = []
  unreadCount.value = 0
  isPanelOpen.value = false
},
  
  setBannerRefreshCallback(cb) {
    onBannerRefresh = cb
  },

  // ── 공유 상태 ──────────────────────────────────────
  notifications,
  unreadCount,
  isPanelOpen,
}

export default NotificationService
