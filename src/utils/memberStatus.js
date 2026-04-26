const STD_STATUS_MAP = {
  enrolled:   '재학',
  absence:    '휴학',
  graduation: '졸업',
  expulsion:  '퇴학',
  quit:       '자퇴'
}

const PROF_STATUS_MAP = {
  employment: '재직',
  absence:    '휴직',
  retirement: '퇴임'
}

const STF_STATUS_MAP = {
  employment: '재직',
  absence:    '휴직',
  retirement: '퇴사'
}

export const statusKorean = item => {
  if (item.stdStatus)  return STD_STATUS_MAP[item.stdStatus]  || '-'
  if (item.profStatus) return PROF_STATUS_MAP[item.profStatus] || '-'
  if (item.stfStatus)  return STF_STATUS_MAP[item.stfStatus]  || '-'
  return '-'
}
