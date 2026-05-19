<template>
  <div class="scan-page">

    <!-- ── 카메라 스캔 화면 ──────────────────────────────── -->
    <template v-if="phase === 'scanning'">
      <div class="camera-wrap">
        <video ref="videoRef" class="camera-video" autoplay muted playsinline />
        <!-- QR 프레임 캡처용 canvas — 화면에는 숨김 -->
        <canvas ref="canvasRef" class="hidden-canvas" />

        <!-- 스캔 가이드 오버레이 -->
        <div class="scan-overlay">
          <!-- [추가] 스캔 취소 후 홈으로 돌아가기 버튼 -->
          <button class="btn-back-home" @click="cancelScan">← 홈으로</button>
          <div class="scan-frame-box" />
          <p class="scan-hint">QR 코드를 네모 안에 맞춰주세요</p>
        </div>
      </div>
    </template>

    <!-- ── PC 접속 차단 ───────────────────────────────── -->
    <template v-else-if="phase === 'desktop'">
      <div class="result-card denied">
        <span class="result-icon">📱</span>
        <p class="result-title">모바일 전용 기능</p>
        <p class="result-sub">QR 출석은 모바일에서만 사용할 수 있습니다.<br>스마트폰으로 접속해주세요.</p>
      </div>
    </template>

    <!-- ── 카메라 권한 거부 ─────────────────────────────── -->
    <template v-else-if="phase === 'denied'">
      <div class="result-card denied">
        <span class="result-icon">📷</span>
        <p class="result-title">카메라 권한 필요</p>
        <p class="result-sub">브라우저 주소창의 카메라 아이콘을 눌러 권한을 허용하고 새로고침해주세요.</p>
      </div>
    </template>

    <!-- ── API 처리 중 ──────────────────────────────────── -->
    <template v-else-if="phase === 'processing'">
      <div class="result-card processing">
        <span class="result-icon">⏳</span>
        <p class="result-title">출석 처리 중...</p>
      </div>
    </template>

    <!-- ── 출석 성공 ────────────────────────────────────── -->
    <template v-else-if="phase === 'success'">
      <div class="result-card success">
        <span class="result-icon">✅</span>
        <p class="result-title">출석 완료!</p>
        <p class="result-date">{{ scanResult?.classDate }}</p>
        <div class="result-actions">
          <button class="btn btn-primary" @click="goToMyAttendance">내 출석 확인</button>
          <button class="btn btn-secondary" @click="goToHome">홈으로</button>
        </div>
      </div>
    </template>

    <!-- ── 이미 출석 (409) ──────────────────────────────── -->
    <template v-else-if="phase === 'already'">
      <div class="result-card already">
        <span class="result-icon">✔️</span>
        <p class="result-title">이미 출석 처리됨</p>
        <p class="result-sub">오늘 이 강의는 이미 출석 체크되었습니다.</p>
        <button class="btn btn-secondary" @click="goToHome">홈으로</button>
      </div>
    </template>

    <!-- ── 오류 (WiFi·만료·미수강 등) ──────────────────── -->
    <template v-else-if="phase === 'error'">
      <div class="result-card error">
        <span class="result-icon">❌</span>
        <p class="result-title">출석 실패</p>
        <p class="result-sub">{{ errorMsg }}</p>
        <div class="result-actions">
          <button class="btn btn-primary" @click="restartScan">다시 시도</button>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import jsQR from 'jsqr'
import attendanceService from '@/services/attendanceService.js'

const router = useRouter()
const route  = useRoute()

// ── 상태 ────────────────────────────────────────────────────────────────────
// phase: 'desktop' | 'scanning' | 'processing' | 'success' | 'already' | 'error' | 'denied'
const phase      = ref('scanning')
const scanResult = ref(null)   // { attendId, status, classDate }
const errorMsg   = ref('')

// ── 카메라 refs ──────────────────────────────────────────────────────────────
const videoRef  = ref(null)
const canvasRef = ref(null)
let stream      = null   // MediaStream — 언마운트 시 해제
let scanTimer   = null   // setInterval ID

// ── 카메라 시작 ─────────────────────────────────────────────────────────────
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },  // 후면 카메라
    })
    videoRef.value.srcObject = stream
    // video가 실제로 재생되기 시작하면 스캔 루프 시작
    videoRef.value.addEventListener('playing', startScanLoop, { once: true })
  } catch (e) {
    // NotAllowedError: 사용자가 권한 거부
    phase.value = 'denied'
  }
}

// ── QR 스캔 루프 (300ms마다 프레임 캡처 후 jsQR 디코딩) ─────────────────────
function startScanLoop() {
  scanTimer = setInterval(scanFrame, 300)
}

function scanFrame() {
  const video  = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return

  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, canvas.width, canvas.height, {
    inversionAttempts: 'dontInvert',
  })

  if (code?.data) {
    stopScan()
    // QR 내용이 URL이면 token 파라미터 추출, UUID 그대로면 그대로 사용 (하위 호환)
    handleToken(extractToken(code.data))
  }
}

// ── 스캔 중지 (카메라 + 타이머) ──────────────────────────────────────────────
function stopScan() {
  clearInterval(scanTimer)
  scanTimer = null
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

// ── QR 토큰 감지 후 API 호출 ─────────────────────────────────────────────────
async function handleToken(token) {
  phase.value = 'processing'
  try {
    const res  = await attendanceService.checkInByQR(token)
    // res = ResultResponse: { status, message, data: { attendId, status, classDate } }
    scanResult.value = res.data
    phase.value = 'success'
  } catch (e) {
    const status  = e.response?.status
    const message = e.response?.data?.message ?? ''

    if (status === 409) {
      // A003: 이미 출석 — 별도 단계로 구분 (에러가 아님)
      phase.value = 'already'
    } else {
      phase.value = 'error'
      errorMsg.value = resolveErrorMsg(status, message)
    }
  }
}

// HTTP 상태·메시지로 사용자 친화적 문구 결정
function resolveErrorMsg(status, message) {
  if (status === 403 && message.includes('네트워크'))  return '교내 WiFi(192.168.0.x)에 연결 후 다시 시도해주세요.'
  if (status === 403 && message.includes('수강'))      return '수강 신청하지 않은 강의입니다.'
  if (status === 403 && message.includes('등록금'))    return '등록금 미납으로 출석 체크가 불가합니다.'
  if (status === 400 && message.includes('만료'))      return 'QR이 만료되었습니다. 교수님 화면의 최신 QR을 다시 스캔해주세요.'
  if (status === 400 && message.includes('세션'))      return '현재 활성화된 출석 세션이 없습니다.'
  if (status === 400 && message.includes('수업'))      return '오늘은 이 강의의 수업일이 아닙니다.'
  return message || '출석 처리 중 오류가 발생했습니다.'
}

// ── QR 데이터에서 토큰 추출 ──────────────────────────────────────────────────
// QR 내용이 URL이면 ?token= 파라미터 추출, UUID 직접이면 그대로 반환
function extractToken(data) {
  try {
    const url = new URL(data)
    return url.searchParams.get('token') ?? data
  } catch {
    return data
  }
}

// ── 재스캔: 카메라 다시 열기 ─────────────────────────────────────────────────
async function restartScan() {
  phase.value      = 'scanning'
  scanResult.value = null
  errorMsg.value   = ''
  await startCamera()
}

// ── [추가] 스캔 취소 후 홈으로 이동 ──────────────────────────────────────────
function cancelScan() {
  stopScan()
  router.push('/student/attendances/home')
}

// ── 내 출석 확인 페이지로 이동 ──────────────────────────────────────────────
function goToMyAttendance() {
  router.push('/student/attendances/my')
}

// ── 홈으로 돌아가기 ──────────────────────────────────────────────────────────
function goToHome() {
  router.push('/student/attendances/home')
}

// ── 모바일 기기 여부 확인 ─────────────────────────────────────────────────────
// userAgent로 모바일(Android/iOS) 판별 — PC 브라우저 접속 시 카메라 시작 대신 안내 화면 표시
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// ── 라이프사이클 ─────────────────────────────────────────────────────────────
onMounted(() => {
  if (!isMobile()) {
    phase.value = 'desktop'
    return
  }
  // 일반 카메라/QR 스캐너로 스캔 시 URL에 ?token= 포함되어 진입
  // → 카메라 없이 즉시 API 제출. 만료된 경우 error 화면 + "다시 시도" 버튼으로 카메라 재시작
  const urlToken = route.query.token
  if (urlToken) {
    handleToken(urlToken)
    return
  }
  startCamera()
})
onUnmounted(stopScan)
</script>

<style scoped lang="scss">
.scan-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

/* ── 카메라 영역 ── */
.camera-wrap {
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 9 / 16;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hidden-canvas {
  display: none;
}

/* ── 스캔 가이드 오버레이 ── */
.scan-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

/* [추가] 스캔 화면 홈으로 버튼 */
.btn-back-home {
  position: absolute;
  top: 20px;
  left: 16px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.scan-frame-box {
  width: 220px;
  height: 220px;
  border: 3px solid #fff;
  border-radius: 12px;
  box-shadow: 0 0 0 3000px rgba(0, 0, 0, 0.45); /* 프레임 바깥 어둡게 */
}

.scan-hint {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  margin: 0;
}

/* ── 결과 카드 공통 ── */
.result-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}

.result-icon { font-size: 56px; line-height: 1; }
.result-title { font-size: 22px; font-weight: 800; margin: 0; }
.result-date  { font-size: 15px; color: #555; margin: 0; }
.result-sub   { font-size: 14px; color: #777; margin: 0; line-height: 1.5; }

/* 카드 색상별 타이틀 색 */
.result-card.success  .result-title { color: #2e7d32; }
.result-card.already  .result-title { color: #1565c0; }
.result-card.error    .result-title { color: #c62828; }
.result-card.denied   .result-title { color: #e65100; }
.result-card.processing .result-title { color: #555; }

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

/* ── 홈화면 설치 배너 ── */
.install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a2e;
  color: #fff;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  font-size: 14px;
}

.install-banner-actions {
  display: flex;
  gap: 8px;
}

.btn-install {
  flex: 1;
  padding: 9px 0;
  background: #4a7cf7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-dismiss {
  padding: 9px 16px;
  background: transparent;
  color: #aaa;
  border: 1px solid #555;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* ── 버튼 ── */
.btn {
  padding: 13px 0;
  width: 100%;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &.btn-primary   { background: #4a7cf7; color: #fff; }
  &.btn-secondary { background: #f0f0f0; color: #555; }
}
</style>