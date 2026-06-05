<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  theme: { type: String, default: 'sage' },
  type: { type: String, default: 'not_found' },
})

defineOptions({ inheritAttrs: false })

const COPY = {
  not_found:    { title: '지금은 이 페이지를 이용하실 수 없습니다.', message: '주소가 변경되었거나, 일시적으로 접근이 제한된 페이지일 수 있습니다.' },
  forbidden:    { title: '접근 권한이 없는 페이지입니다.', message: '해당 페이지는 인가된 사용자만 이용하실 수 있습니다.' },
  unauthorized: { title: '로그인이 필요한 페이지입니다.', message: '세션이 만료되었거나 로그인이 필요한 페이지입니다.' },
  server:       { title: '일시적인 오류가 발생했습니다.', message: '요청을 처리하는 중에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' },
  maintenance:  { title: '시스템 점검 중입니다.', message: '더 나은 서비스를 위해 시스템 점검을 진행하고 있습니다.' },
  session:      { title: '세션이 만료되었습니다.', message: '일정 시간 동안 활동이 없어 자동으로 로그아웃되었습니다.' },
}

const copy = computed(() => COPY[props.type] || COPY.not_found)

const router = useRouter()
const goHome = () => router.push('/')
const goBack = () => (window.history.state?.back ? router.back() : router.push('/'))
</script>

<template>
  <div class="error-page">
    <img class="emblem" src="@/assets/emblem.png" alt="" />
    <h1>{{ copy.title }}</h1>
    <p>{{ copy.message }}</p>
    <div class="actions">
      <button class="btn btn-submit" @click="goHome">홈으로 돌아가기</button>
      <button class="btn btn-line" @click="goBack">이전 페이지로</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  background: $default-bg;
  font-family: $font-sans;
  color: $font-color;

  @media (max-width: 768px) {
    background: #fff;
  }
}
.emblem { width: 180px; height: 180px; display: block; margin-bottom: 48px;}
h1 { font-size: clamp(28px, 4vw, 60px); font-weight: 600; letter-spacing: -0.025em; line-height: 1.25; margin: 0 0 24px; white-space: pre-line; color: $green-700;}
p { font-size: clamp(15px, 1.4vw, 16px); line-height: 1.75; max-width: 560px; margin: 0 0 48px;}
.actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.btn-submit{background-color: $green-700;border-color: $green-700;}
.btn-line:hover{border-color: $green-700;color: $green-700;}
</style>