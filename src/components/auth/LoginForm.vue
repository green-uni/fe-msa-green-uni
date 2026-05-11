<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue'

const router = useRouter();
const modeShowPw = ref(false)

defineProps({
  form: Object,
})
const emit = defineEmits(['login'])
const pwView = () => { modeShowPw.value = !modeShowPw.value }
</script>

<template>
  <div class="login-content" @keyup.enter="emit('login')">
    <div class="login-box input-content">
      <label class="login-input">
        <input type="text" placeholder="학번/교번/사번" v-model="form.memberCode">
      </label>
      <label class="login-input">
        <input :type="modeShowPw ? 'text' : 'password'" placeholder="비밀번호" v-model="form.password">
        <span @click="pwView" class="showPw" :class="!modeShowPw || 'show'">
          <font-awesome-icon icon="fa-solid fa-eye" />
        </span>
      </label>
    </div>
    <button class="btn btn-submit" @click="emit('login')">로그인</button>
  </div>
  <div class="changePw">
    <button @click="router.push('/auth/password')">비밀번호 찾기</button>
  </div>
</template>

<style scoped lang="scss">
.login-content{
  width: 100%;display: flex;gap: 10px;
  .login-box{
    flex-grow:1;display: flex;flex-direction: column;gap: 5px;
    .login-input{position: relative;}
  }
  button.btn{width: 100px;}
}

.showPw{
  position: absolute;right: 10px;top: 50%;transform: translateY(-50%);color: #ddd;cursor: pointer;
  &.show{color: var(--font-color);}
}

.changePw{
  border-top: 1px solid var(--line-color);padding: 10px 0;
  button{
    font-size: .9em;background: none;border: none;color: #aaa;cursor: pointer;text-decoration: underline; text-underline-offset:4px;
    &:hover{color: var(--main-color);}
  }
}
</style>    