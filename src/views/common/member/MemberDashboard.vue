<script setup>
import TimetableWidget from '@/components/dashboard/TimetableWidget.vue'
import ActiveScheduleBanner from '@/components/dashboard/ActiveScheduleBanner.vue'
import MonthlyScheduleWidget from '@/components/dashboard/MonthlyScheduleWidget.vue'
import TodayLectureWidget from '@/components/dashboard/TodayLectureWidget.vue'
import TuitionStatus from '@/views/admin/tuition/TuitionStatus.vue';
import { useAuthStore } from '@/stores/authentication'
const authStore = useAuthStore()

</script>

<template>
<h3>대시보드</h3>
<ActiveScheduleBanner />
<TimetableWidget />
<TodayLectureWidget v-if="authStore.role === 'PROFESSOR'" />
<MonthlyScheduleWidget />
<TuitionStatus />
</template>

<style scoped>

</style>