<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue'

const router = useRouter();
const modeShowPw = ref(false)

defineProps({
  form: Object,
  variant: {
    type: String,
    default: 'academic',
  },
})
const emit = defineEmits(['login'])
const pwView = () => { modeShowPw.value = !modeShowPw.value }
</script>

<template>
  <div class="login-form" :class="`login-form-${variant}`" @keyup.enter="emit('login')">
    <label class="field">
      <span class="field__label">{{ variant == 'admin' ? '사번' : '학번/교번' }}</span>
      <input type="text" placeholder="학번/교번/사번" v-model="form.memberCode" required>
    </label>
    <label class="field">
      <span class="field__label">비밀번호</span>
      <input :type="modeShowPw ? 'text' : 'password'" placeholder="비밀번호" v-model="form.password" required>
      <span @click="pwView" class="showPw" :class="!modeShowPw || 'show'">
        <font-awesome-icon icon="fa-solid fa-eye" />
      </span>
    </label>
    <div class="login-form-row">
      <div class="changePw">
        <button @click="router.push('/auth/password')">비밀번호 찾기</button>
      </div>
    </div>
    <button class="btn" @click="emit('login')">로그인</button>
    <p class="login-form-hint">
      {{ variant == 'admin' ? '신규 입사자는' : '신입생은' }} 최초 비밀번호로 <b>생년월일 6자리</b>를 사용해 주세요.
    </p>
  </div>
</template>

<style scoped lang="scss">
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &-row {
    display: flex;
    align-items: center;
    justify-content: end;
    margin-top: 2px;

    .changePw {
      button {
        font-size: .95em;
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;

        &:hover {
          color: var(--main-color);
        }
      }
    }
  }

  &-hint {
    margin: 0;

    b {
      color: $green-600;
      font-weight: bold;
    }
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;

  &__label {
    font-size: .95em;
    font-weight: 600;
  }

  input {
    height: 40px;
    padding: 0 12px;
    border: 1px solid $line-color;
    border-radius: 5px;
    background: #fafdfb;
    color: $font-color;
    transition: border-color .15s, box-shadow .15s;

    &::placeholder {
      color: #ddd;
    }

    &:hover {
      border-color: $line-color;
    }

    &:focus {
      outline: none;
      background: #fff;
      border-color: $green-600;
      box-shadow: 0 0 0 4px rgba($hover-bg-color, .14);
    }
  }

  .showPw {
    position: absolute;
    right: 10px;
    top: 70%;
    transform: translateY(-50%);
    color: #ddd;
    cursor: pointer;

    &.show {
      color: var(--font-color);
    }
  }
}

.btn {
  height: 50px;
  border: 0;
  font-weight: 700;
  cursor: pointer;
  transition: transform .05s ease, box-shadow .2s ease;
  letter-spacing: 2px;
  background: $green-600;
  color: #fff;
}

.login-form-admin {
  .field input {
    background: $admin-default-bg2;
    border-color: $green-600;
    color: #fff;

    &::placeholder {
      color: #999;
    }
  }
}
</style>