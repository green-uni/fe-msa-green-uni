import { useModalStore } from "@/stores/modal";


/*
임시저장, 취소(reset) 버튼
사용법
- import { saveToLocalStorage, loadfromLocalStorage, clearLocalStorage, DRAFT_KEY } from '@/utils/button';



-- 임시저장 사용법
function save() {
  saveToLocalStorage(DRAFT_KEY, state);
}
-- 취소 사용법

// 초기화 <-- 페이지에 맞게 설정
function reset() {
  Object.assign(state, {
    name: '', active: 'running', college: '',
    room: '', tel: '', chairProfessor: '',
    capacity: '', startDate: '', info: '',
  });
}

function cancel() {
  clearLocalStorage(DRAFT_KEY); //저장소 부분 삭제
  reset(); //화면에서 보이는 것들 삭제
}
*/

export const DRAFT_KEY = 'majorCreateDraft';

export const saveToLocalStorage = (key, data) => { /*임시저장*/
  localStorage.setItem(key, JSON.stringify(data))
  const modal = useModalStore();
  modal.showAlert('임시저장 되었습니다.', 'info');
}

/*localStorage에 넣어둔 데이터 꺼내기 => [임시저장 버튼]과 [페이지 로드(onMounted)] 사이의 징검다리 역할*/
export const loadfromLocalStorage = (key) => {
  const draft = localStorage.getItem(key)
  return draft ? JSON.parse(draft) : null
}

export const clearLocalStorage = (key) => { /*저장소 비움*/
  localStorage.removeItem(key)
}
