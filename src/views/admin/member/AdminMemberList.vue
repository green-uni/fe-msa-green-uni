<script setup>
import { onMounted, reactive, computed, ref } from 'vue'


import MemberService from '@/services/memberService'


onMounted(async () => {
    const res = await MemberService.findStudents()
    console.log(res.data)
})
</script>

<template>

</template>

<style scoped lang="scss">
</style>
