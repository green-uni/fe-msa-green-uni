import { ref } from "vue"
import { defineStore } from 'pinia';

// 생성/수정 시 state 내용 변화 감지 (MemberCreateMod)
export const usePageStateStore = defineStore('pageState', () => {
  const isContent = ref(false)
  const setContent = (val) => { isContent.value = val }
  return { isContent, setContent }
})
