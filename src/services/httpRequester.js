import axios from 'axios'
import AuthService from './authService'
import { useAuthStore } from '@/stores/authentication'
import { useModalStore } from '@/stores/modal'
import router from '@/router'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.withCredentials = true
let reissuePromise = null

// 에러 페이지로 보낼 상태 코드 정의
const ERROR_PAGE_ROUTES = {
  403: 'Forbidden',
  404: 'NotFound',
  500: 'ServerError',
  502: 'ServerError',
  503: 'Maintenance',
}

// 인터셉터
axios.interceptors.response.use(
  (res) => res, // 정상적 통신이라면 그대로 사용
  async (err) => {
    // 에러 발생시
    console.log('err: ', err)
    if (err.response) {
      const authStore = useAuthStore() // 이하 토큰 만료시 자동 연장 // 로그인 인증 관련
      if (err.config.url === '/auth/reissue') {
        //AT 재발급 시도했으나 에러 >> RT 만료
        const redirectPath = authStore.role === 'ADMIN' ? '/admin/login' : '/login'
        authStore.logOut() //로그아웃 처리
        router.push(redirectPath)
      } else if (err.response.status === 401) { // 401 UnAuthorized > 토큰 미존재
        if (authStore.isLogin) { // 로그인 상태인데 401 응답 >> AT 만료 >> AT 재발행
          if (!reissuePromise) {
            //AccessToken 재발행 시도
            reissuePromise = AuthService.reissue().finally(() => {
              reissuePromise = null
            })
          }
          await reissuePromise
          // 중단된 요청을(에러난 요청)을 토큰 갱신 후 재요청
          return await axios.request(err.config)
        } else if (['/auth/login', '/auth/admin/login'].includes(err.config.url)) {
          // 로그인 시도 자체의 401 → 모달 표시
          const message = err.response.data?.message || '코드와 비밀번호를 확인해주세요.'
          const modalStore = useModalStore()
          modalStore.showAlert(message, 'error')
        } else { // 미로그인 상태 >> 로그인 페이지로 이동
          router.push(authStore.role === 'ADMIN' ? '/admin/login' : '/login')
        }
      } else {
        // 위 두가지 경우가 아닐 경우 에러메세지를 저장하고 띄우겠다.
        // _skipModal: true 설정 시 모달 생략 — 자체 에러 UI가 있는 화면(QR 스캔 등) 중복 팝업 방지
        if (!err.config?._skipModal) {
          // ⭐️ 수정 [2] — 블로킹 에러(403/500/502/503)는 모달 대신 에러페이지로 이동
          // 아래 if 블록만 새로 추가하고, 기존 모달 로직은 else 안에 그대로 둠
          if (ERROR_PAGE_ROUTES[err.response.status] && !err.config?._skipErrorPage) {
            router.replace({ name: ERROR_PAGE_ROUTES[err.response.status] })
          } else {
            // [개발용] 배포 시 삭제 후 아래 [배포용] 주석 해제
            const message =
              err.response.data?.message ||
              err.response.data?.result ||
              `${err.response.status} 오류가 발생했습니다.`
            // [배포용]
            // const STATUS_MESSAGES = {
            //   400: '잘못된 요청입니다.',
            //   401: '로그인이 필요합니다.',
            //   403: '접근 권한이 없습니다.',
            //   404: '요청한 리소스를 찾을 수 없습니다.',
            //   500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            // }
            // const message = err.response.data?.message || err.response.data?.result
            //               || STATUS_MESSAGES[err.response.status]
            //               || `${err.response.status} 오류가 발생했습니다.`;

            const modalStore = useModalStore()
            modalStore.showAlert(message, 'error')
          }
        }
      }
    }
    return Promise.reject(err) // err.response가 없다면 Promise 객체를 reject를 반환
  },
)

export default axios // 이 axios를 사용하는 모든 js의 통신 기본 세팅
