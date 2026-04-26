import { useModalStore } from '@/stores/modal'
const modal = useModalStore();

export const checkValidation = (state, rules) => {
  let combinedMessage = '';

  // rules 객체의 키를 순회하며 검증
  for (const key in rules) {
    const value = (state[key] || '').toString().trim();
    const rule = rules[key];

    let message = '';
    // 1. 필수값 체크 (notNull)
    if (rule.notNull && value.length === 0) {
      message = rule.notNullMessage + '\n';
    }
    // 2. 정규식 체크 (값이 있을 때만)
    else if (value.length > 0 && rule.regexp) {
      const re = new RegExp(rule.regexp);
      if (!re.test(value)) {
        message = rule.regexpMessage + '\n';
      }
    }

    combinedMessage += message;
  }

  if (combinedMessage.length > 0) {
    modal.showAlert(combinedMessage, 'error');
    return true; // 에러 있음
  }

  return false; // 에러 없음
};
