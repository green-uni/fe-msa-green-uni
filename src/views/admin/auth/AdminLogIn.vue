  <script setup>
  import logo from '@/assets/logo.png';
  import AuthService from '@/services/authService';
  import { reactive, watch } from 'vue';
  import { useAuthStore } from '@/stores/authentication';
  import { useRouter } from 'vue-router';
  import LoginForm from '@/components/auth/LoginForm.vue';

  const authStore = useAuthStore()
  const router = useRouter();

  const state = reactive({
    form: {
      memberCode: '20253001',
      password: '1234'
    },
    role: 'ADMIN'
  })

  const login = async () => {
    try {
      const res = await AuthService.logIn(state.form);
      console.log(res.data)
      authStore.logIn(res.data);
      if (res.data.isFirstLogin) {
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
          <button @click="router.push('/login')">학사 로그인 페이지로</button>
        </div>
        <div class="d-flex ai-center jc-center">
          <img :src="logo" @click="moveToMain" />
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
</style>
