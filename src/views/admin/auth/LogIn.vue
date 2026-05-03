  <script setup>
  import logo from '@/assets/logo.png';
  import AuthService from '@/services/authService';
  import { reactive, watch } from 'vue';
  import { useAuthStore } from '@/stores/authentication';
  import { useRouter } from 'vue-router';

  const authStore = useAuthStore()
  const router = useRouter();

  const state = reactive({
    form: {
      memberCode: '20203111',
      password: '1234'
    },
    modeShowPw: false,
    role: 'ADMIN'
  })

  const pwView = () => { state.modeShowPw = !state.modeShowPw }

  const login = async () => {
    try {
      const res = await AuthService.logIn(state.form);
      console.log(res.data)
      authStore.logIn(res.data);
      if(res.data.isFirstLogin){
        router.push('/auth/password')
      }
      router.push('/admin/members/my')
    } catch (e) {
      console.error(e)
    }
  }
  </script>

  <template>
    <section class="d-flex ai-center jc-center h100vh " style="background: #000;">
      <div class="login-wrap">
        <div class="d-flex ai-center jc-center">
          <img :src="logo" @click="moveToMain" />
        </div>
        <div class="login-content" @keyup.enter="login">
          <div class="login-box input-content">
            <label class="login-input">
              <input type="text" placeholder="학번/교번/사번" v-model="state.form.memberCode">
            </label>
            <label class="login-input">
              <input :type="state.modeShowPw ? 'text' : 'password'" placeholder="비밀번호" v-model="state.form.password">
              <span @click="pwView" class="showPw" :class="!state.modeShowPw || 'show'"><font-awesome-icon
                  icon="fa-solid fa-eye" /></span>
            </label>
          </div>
          <button class="btn btn-submit" @click="login">로그인</button>
        </div>
        <div class="changePw">
          <button @click="router.push('/auth/password')">비밀번호 찾기</button>
        </div>
      </div>
    </section>
  </template>

  <style scoped>
  .login-wrap{max-width:350px; width: 100%;display: grid;gap: 20px;}

  .login-content{width: 100%;display: flex;gap: 10px;}
  .login-content .login-box{flex-grow:1;display: flex;flex-direction: column;gap: 5px;}
  .login-content .login-box .login-input{position: relative;}

  .radio-group{font-size: 1rem;gap: 2px;}
  .radio-tab .radio-label:before,
  .radio-tab .radio-label:after{display: none!important;}
  .radio-tab .radio-label:nth-of-type(1){border-radius: 15px 2px 2px 15px;}
  .radio-tab .radio-label:nth-of-type(2){border-radius: 2px;}
  .radio-tab .radio-label:nth-of-type(3){border-radius: 2px 15px 15px 2px;}
  .radio-tab .radio-label:has(input[type='radio']:checked){background: #fff;color: var(--main-color);font-weight: bold;}

  .showPw{position: absolute;right: 10px;top: 50%;transform: translateY(-50%);color: #ddd;cursor: pointer;}
  .showPw.show{color: var(--font-color);}

  .login-content button.btn{width: 100px;}

  .changePw{border-top: 1px solid var(--line-color);padding: 10px 0;}
  .changePw button{font-size: .9em;background: none;border: none;color: #aaa;cursor: pointer;text-decoration: underline; text-underline-offset:4px;}
  .changePw button:hover{color: var(--main-color);}
  </style>
