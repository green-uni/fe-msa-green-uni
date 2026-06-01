export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dateTime.split('T')[0]
}
