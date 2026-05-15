<script setup>
import { computed } from 'vue';

const props = defineProps({
  password: {
    type: String,
    default: ''
  }
});

// 비밀번호 정규식 로직을 컴포넌트 안으로 응집
const checks = computed(() => ({
  minLength: props.password.length >= 10, 
  letter:  /[A-Za-z]/.test(props.password),
  number:  /\d/.test(props.password),
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(props.password)
}))
defineExpose({ checks })
</script>

<template>
  <ul class="pw-check-list">
    <li :class="{ pass: checks.letter }">
      <font-awesome-icon :icon="checks.letter ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
      영문자 포함
    </li>
    <li :class="{ pass: checks.number }">
      <font-awesome-icon :icon="checks.number ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
      숫자 포함
    </li>
    <li :class="{ pass: checks.special }">
      <font-awesome-icon :icon="checks.special ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
      특수기호 포함
    </li>
    <li :class="{ pass: checks.minLength }">
      <font-awesome-icon :icon="checks.minLength ? 'fa-solid fa-check' : 'fa-solid fa-xmark'" />
      10자 이상
    </li>
  </ul>
</template>

<style scoped lang="scss">
.pw-check-list{font-size: .8em;color: #ccc;display: flex;gap: 2px;padding:1px;margin-top:5px;
  li{background: var(--error-bg);color: var(--error);padding: 2px 5px;border-radius: 5px;transition: 0.4s;
    &.pass{color: var(--success);background-color: var(--success-bg);}
  }
}
</style>
