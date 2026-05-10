<script setup>
import CalendarDate from '@/components/util/CalendarDate.vue'

const props = defineProps({
  common: { type: Object, required: true },
})


// 도로명 주소 검색 API
const execDaumPostcode = () => {
  new window.daum.Postcode({
    oncomplete: (data) => {
      // 도로명 vs 지번 주소
      if (data.userSelectedType === 'R') {
        props.common.address = data.roadAddress
      } else {
        props.common.address = data.jibunAddress
      }
      // 우편번호
      props.common.postcode = data.zonecode
      // 상세주소 초기화
      props.common.detailAddress = ''
    },
  }).open()
}

</script>

<template>
  <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(350px, 1fr))">
    <div class="input-wrap">
      <div class="input-label"><span>이름</span></div>
      <div class="input-content">
        <label>
          <input type="text" v-model="props.common.name" placeholder="이름" />
        </label>
      </div>
    </div>
    <div class="input-wrap">
      <div class="input-label"><span>생년월일</span></div>
      <div class="input-content">
        <CalendarDate v-model="props.common.birth" />
      </div>
    </div>
    <div class="input-wrap">
      <div class="input-label"><span>전화번호</span></div>
      <div class="input-content">
        <label>
          <input type="number" v-model="props.common.tel" placeholder="-없이 작성해주세요" />
        </label>
      </div>
    </div>
    <div class="input-wrap">
      <div class="input-label">
        <span>비상<br />전화번호</span>
      </div>
      <div class="input-content">
        <label>
          <input type="number" v-model="props.common.emergencyTel" placeholder="-없이 작성해주세요" />
        </label>
      </div>
    </div>
    <div class="input-wrap">
      <div class="input-label"><span>이메일</span></div>
      <div class="input-content">
        <label>
          <input type="text" v-model="props.common.email" placeholder="이메일을 입력해주세요" />
        </label>
      </div>
    </div>
    <div class="input-wrap g-col-full">
      <div class="input-label"><span>주소</span></div>
      <div class="d-flex direct-col g10">
        <div class="input-content d-flex g10">
          <button type="button" @click="execDaumPostcode()" class="btn btn-line">주소 찾기</button>
          <label class="w200">
            <input type="text" v-model="props.common.postcode" placeholder="우편번호" readonly />
          </label>
        </div>
        <div class="input-content two-input">
          <label>
            <input
              class="c-default"
              type="text"
              v-model="props.common.address"
              placeholder="도로명 주소"
              readonly
            />
          </label>
          <label>
            <input
              type="text"
              v-model="props.common.detailAddress"
              placeholder="상세주소를 입력해주세요"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
