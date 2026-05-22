<script setup>
import TimetableWidget from '@/components/dashboard/TimetableWidget.vue'
import ActiveScheduleBanner from '@/components/dashboard/ActiveScheduleBanner.vue'
import MonthlyScheduleWidget from '@/components/dashboard/MonthlyScheduleWidget.vue'
import TodayLectureWidget from '@/components/dashboard/TodayLectureWidget.vue'
import TuitionStatus from '@/views/admin/tuition/TuitionStatus.vue';
import { useAuthStore } from '@/stores/authentication'
import PendingLecturesWidget from '@/components/dashboard/PendingLecturesWidget.vue';
const authStore = useAuthStore()

</script>

<template>
<ActiveScheduleBanner v-if="authStore.role === 'PROFESSOR' || authStore.role === 'STUDENT'" />
<TimetableWidget v-if="authStore.role === 'PROFESSOR' || authStore.role === 'STUDENT'" />
<TodayLectureWidget v-if="authStore.role === 'PROFESSOR'" />
<PendingLecturesWidget v-if="authStore.role === 'ADMIN'" />
<MonthlyScheduleWidget />
<TuitionStatus v-if="authStore.role === 'ADMIN'" />
</template>

<style scoped>

</style>