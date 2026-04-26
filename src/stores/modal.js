// await modal.showAlert('원하는 메시지 적기', '원하는 타입 적기') -> alert 호출
// await modal.showConfirm('원하는 메시지 적기', '원하는 타입 적기') -> confirm 호출
// 기본적으로 'info' 타입으로 작동

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false); //모달이 현재 화면에 보이는지 안 보이는지를 결정하는 스위치
  const message = ref('');
  const isConfirm = ref(false); //이 모달이 단순 알림용(alert = false)인지, 사용자에게 물어보는 용도(confirm = true)인지 구분하는 모드 설정
  const resolvePromise = ref(null); //Promise 반환하도록 설계 - promise: 비동기 흐름을 붙잡아두는 역할
  const type = ref('info'); // 타입 종류: 'success', 'error', 'info', 'warning'

  // Alert 호출
  const showAlert = (msg, typeName = 'info') => {
    message.value = msg;
    type.value = typeName;
    isConfirm.value = false;
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve; //resolve: 사용자가 버튼 누를 때까지 코드를 잠깐 멈춰 세워두는 주차권
    });
  };

  // Confirm 호출
  const showConfirm = (msg, typeName = 'info') => {
    message.value = msg;
    type.value = typeName;
    isConfirm.value = true;
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve;
    });
  };

  // 닫기 및 결과 반환 - 사용자가 '확인' 클릭 시 실행
  const close = (result) => {
    isOpen.value = false;
    if (resolvePromise.value) {
      resolvePromise.value(result); //보관된 resolvePromise를 꺼내서 true 반환
      resolvePromise.value = null; //보관한 거 리셋
    }
  };

  return { isOpen, message, isConfirm, type, showAlert, showConfirm, close };
});
