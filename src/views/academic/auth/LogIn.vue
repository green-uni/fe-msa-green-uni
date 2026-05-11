  <script setup>
  import logo from '@/assets/logo.png';
  import { reactive, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/authentication';
  import { useModalStore } from '@/stores/modal'
  import AuthService from '@/services/authService';
  import MemberService from '@/services/memberService';
  import LoginForm from '@/components/auth/LoginForm.vue';

  const authStore = useAuthStore()
  const modal = useModalStore()
  const router = useRouter();

  const state = reactive({
    form: {
      memberCode: '20221001',
      password: '1234'
    },
    role: 'STUDENT'
  })
  
  watch(() => state.role, (role) => {
    if (role === 'STUDENT') {
      state.form.memberCode = '20221001'
      state.form.password = '1234'
    } else if (role === 'PROFESSOR') {
      state.form.memberCode = '20152001' 
      state.form.password = '1234'
    } 
  })

  const login = async () => {
    try {
      const res = await AuthService.logIn(state.form);
      // console.log(res)

      if(res.data.isFirstLogin == true){
        await modal.showAlert('최초 로그인 입니다. 비밀번호를 변경해주세요', 'warning')
        authStore.logIn(res.data);
        const profile = await MemberService.findProfile();
        authStore.setProfile(profile.data);

        if(res.data.deviceId === 'mobile'){
          router.push('/attend/my/password')
        } else{
          await router.push('/members/my/password')
        }        
        return
      }

      authStore.logIn(res.data);
      const profile = await MemberService.findProfile();
      authStore.setProfile(profile.data);

      if (res.data.role === 'STUDENT' && res.data.deviceId === 'mobile') {
        router.push('/attend')
        return
      }
      router.push('/members/my')

    } catch (e) {
      console.error(e)
    }
  }
  </script>

  <template>
    <section class="d-flex ai-center jc-center h100vh">
      <div class="login-wrap">
        <div  class="d-flex ai-center jc-center">
          <button @click="router.push('/admin/login')">관리자 로그인 페이지로</button>
        </div>
        <div class="d-flex ai-center jc-center">
          <img :src="logo" @click="moveToMain" />
        </div>


        <div class="sample-data d-grid g10">
          <div class="input-content radio-group radio-tab">
            <label class="radio-label">
              <input type="radio" name="role" value="STUDENT" v-model="state.role">
              <span>학생</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="role" value="PROFESSOR" v-model="state.role">
              <span>교수</span>
            </label>
          </div>
        </div>

        <LoginForm
          :form="state.form"
          @login="login"
        />
      </div>
    </section>
  </template>

  <style scoped lang="scss">
  .login-wrap{max-width:350px; width: 100%;display: grid;gap: 20px;}

.radio-group{font-size: 1rem;gap: 2px;}
.radio-tab .radio-label{
  &:before,&:after{display: none!important;}
  &:nth-of-type(1){border-radius: 15px 2px 2px 15px;}
  &:nth-of-type(2){border-radius: 2px;}
  &:nth-of-type(3){border-radius: 2px 15px 15px 2px;}
  &:has(input[type='radio']:checked){background: #fff;color: var(--main-color);font-weight: bold;}
}
  </style>
