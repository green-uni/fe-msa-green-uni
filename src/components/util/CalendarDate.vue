<script setup>
import { ref } from 'vue';

// 부모에서 v-model로 받을 날짜값
// 이 컴포넌트 import하고, template에서 <CalendarDate v-model="state.startDate" />만 쓰면 됨
const props = defineProps({
  modelValue: String,
  disabled: { type: Boolean, default: false },
  highlightedDates: { type: Array, default: () => [] }
});

function isHighlighted(day) {
    if (!day.currentMonth) return false;
    const mm = String(calendarMonth.value + 1).padStart(2, '0');
    const dd = String(day.day).padStart(2, '0');
    const dateStr = `${calendarYear.value}-${mm}-${dd}`;
    return props.highlightedDates.includes(dateStr);
}

const emit = defineEmits(['update:modelValue']);

// 달력 표시 여부
const showCalendar = ref(false);
const calendarMonth = ref(new Date().getMonth());
const calendarYear = ref(new Date().getFullYear());

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 달력 날짜 계산
function getCalendarDays() {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1).getDay();
  const daysInMonth = new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate();
  const prevDays = new Date(calendarYear.value, calendarMonth.value, 0).getDate();
  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevDays - i, currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false });
  }
  return days;
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11;
    calendarYear.value--;
  } else {
    calendarMonth.value--;
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0;
    calendarYear.value++;
  } else {
    calendarMonth.value++;
  }
}

function selectDate(day) {
  if (!day.currentMonth) return;
  const mm = String(calendarMonth.value + 1).padStart(2, '0');
  const dd = String(day.day).padStart(2, '0');
  emit('update:modelValue', `${calendarYear.value}-${mm}-${dd}`); // 부모로 전달
  showCalendar.value = false;
}

function isSelectedDate(day) {
  if (!day.currentMonth || !props.modelValue) return false;
  const [y, m, d] = props.modelValue.split('-').map(Number);
  return y === calendarYear.value && m === calendarMonth.value + 1 && d === day.day;
}

function isToday(day) {
  if (!day.currentMonth) return false;
  const today = new Date();
  return today.getFullYear() === calendarYear.value &&
    today.getMonth() === calendarMonth.value &&
    today.getDate() === day.day;
}
</script>

<template>
  <div class="calendar-input-wrap">
    <input :value="modelValue" type="text" class="input-box medium" placeholder="YYYY-MM-DD" readonly
      @click="showCalendar = !showCalendar" :disabled="disabled" />
    <button v-if="!disabled" class="btn in-input" @click="showCalendar = !showCalendar">
      <font-awesome-icon icon="fa-regular fa-calendar" />
    </button>

    <!-- 달력 팝업 -->
    <div v-if="showCalendar" class="calendar-popup">
      <div class="cal-header">
        <button class="cal-nav" @click="prevMonth">&#8249;</button>
        <div class="cal-month-year">
          <select v-model="calendarMonth" class="cal-select">
            <option v-for="(m, idx) in monthNames" :key="idx" :value="idx">{{ m }}</option>
          </select>
          <select v-model="calendarYear" class="cal-select">
            <!--1950년부터 현재 연도까지 출력-->
            <option
              v-for="y in Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i)"
              :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </div>
        <button class="cal-nav" @click="nextMonth">&#8250;</button>
      </div>
      <div class="cal-days-header">
        <span v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d">{{ d }}</span>
      </div>
      <div class="cal-days-grid">
        <button v-for="(day, idx) in getCalendarDays()" :key="idx" class="cal-day" :class="{
          'other-month': !day.currentMonth,
          'selected': isSelectedDate(day),
          'today': isToday(day) && !isSelectedDate(day),
          'highlighted': isHighlighted(day) && !isSelectedDate(day), //출석날짜에 연두색 표시하려고 추가
        }" @click="selectDate(day)">
          {{ day.day }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calendar-field {
  position: relative;
}

.calendar-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.calendar-icon-btn {
  background: var(--main-color);
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  &:hover {
  background: var(--hover-bg-color);
  }
}

.calendar-popup {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 14px;
  width: 260px;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.cal-nav {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #555;
  padding: 0 4px;
  line-height: 1;
}

.cal-month-year {
  display: flex;
  gap: 6px;
}

.cal-select {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  cursor: pointer;
  width: 66px;
}

.cal-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  background: none;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  transition: background 0.15s;
  color: #333;
  &:hover:not(.other-month) {
  background: var(--main-color);
  }
  &.other-month {
  color: #ccc;
  cursor: default;
  }
  &.selected {
  background: var(--main-color);
  color: #fff;
  }
 &.today {
  border: 1.5px solid var(--main-color);
  color: var(--main-color);
  font-weight: 600;
  }
  &.highlighted {
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 600;
    &:hover {
  background: var(--main-color);
  color: #fff;
    }
  }
}
</style>
