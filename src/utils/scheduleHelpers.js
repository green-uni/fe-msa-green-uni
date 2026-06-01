import { BUILDING_LABEL } from '@/utils/constants'

export const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek} ${s.startPeriod}~${s.endPeriod}교시`).join(',\n')
}

export const roomText = (schedules) => {
  if (!schedules?.length) return '-'
  const rooms = [...new Set(schedules.map(s =>
    `${BUILDING_LABEL[s.building] ?? s.building ?? ''} ${s.room ?? ''}`.trim()
  ))]
  return rooms.join(',\n')
}
