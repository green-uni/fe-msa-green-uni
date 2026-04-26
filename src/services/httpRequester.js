import axios from "axios";
import memberService from "./memberService";
import { useAuthStore } from "@/stores/authentication";
import { useModalStore } from "@/stores/modal";

axios.defaults.baseURL = '/api';
axios.defaults.withCredentials = true;

// 인터셉터
axios.interceptors.response.use(
  res => res, // 정상적 통신이라면 그대로 사용
  async err => { // 에러 발생시
    console.log("err: ", err);
    if (err.response) {
      console.log("err.response : ", err.response);
      const authStore = useAuthStore(); // 이하 토큰 만료시 자동 연장 // 로그인 인증 관련
      if (err.config.url === "/member/reissue" && err.response.status === 500) {  //AT 재발급 시도했으나 에러 >> RT 만료
        authStore.logOut(); //로그아웃 처리
      } else if (err.response.status === 401 && authStore.isLogin) {  //로그인 상태인데 401 응답 >> AT 만료 >> AT 재발행

        //401 UnAuthorized 에러인데 FE 로그인 처리 되어 있다면
        await memberService.reissue(); //AccessToken 재발행 시도

        // 중단된 요청을(에러난 요청)을 토큰 갱신 후 재요청
        return await axios.request(err.config);

      } else { // 위 두가지 경우가 아닐 경우 에러메세지를 저장하고 띄우겠다.
        const message = err.response.data?.message  || err.response.data?.result
                                                    || `${err.response.status} 오류가 발생했습니다.`;
        const modalStore = useModalStore();
        modalStore.showAlert(message, 'error');
      }
    }

    return Promise.reject(err); // err.response가 없다면 Promise 객체를 reject를 반환
  },
);

export default axios; // 이 axious를 사용하는 모든 js의 통신 기본 세팅
