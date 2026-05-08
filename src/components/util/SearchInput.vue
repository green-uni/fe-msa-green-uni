<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

/*
<SearchInput
  v-model="modelValue"
  :list="검색할 전체 목록"
  placeholder=""
  @select="(data) => save" 선택한 값에 대한 함수
/>
*/

const props = defineProps({
  modelValue: { type: String, default: '' },      // v-model
  list: { type: Array, default: () => [] },        // 검색할 전체 목록
  labelKey: { type: String, default: 'name' },     // 객체의 밸유
  valueKey: { type: String, default: 'majorId' },  // 객체의 키
  placeholder: { type: String, default: '검색' },

  showOnFocus: { type: Boolean, default: false }, // 입력창 클릭 시 전체 리스트 보여줄지 여부 (쫘라락 기능)
  realtime: { type: Boolean, default: true } // 입력할 때마다 검색할지 여부 (false면 엔터 또는 돋보기 버튼 눌렀을 때 검색)
})

const emit = defineEmits(['update:modelValue', 'select', 'enter'])

const state = reactive({
  relatedSearchList: [],
  selectedIndex: -1,
  isOpen: false // 강의개설 학과검색에서 리스트보기 위해 추가
})

const getChosung = (str) => {
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00
    if (code < 0 || code > 11171) return ch
    return CHO[Math.floor(code / 28 / 21)]
  }).join('')
}
const isChosung = (str) => /^[ㄱ-ㅎ]+$/.test(str)

const onInput = (e) => {
  const query = e.target.value
  emit('update:modelValue', query)
  // 데이터가 없으면 창 닫고 종료
  if (!props.list || props.list.length === 0) {
    state.isOpen = false
    return
  }
  // 데이터가 있다면 필터링하고 결과가 있을 때만 창 유지
  filterList(query)
  state.isOpen = state.relatedSearchList.length > 0

  state.relatedSearchList = props.list.filter(item => {
    if (isChosung(query)) return getChosung(item[props.labelKey]).includes(query)
    return item[props.labelKey].toLowerCase().includes(query.toLowerCase())
  })
  state.selectedIndex = -1
}

const selectItem = (item) => {
  emit('update:modelValue', item[props.labelKey])
  emit('select', item)  // 선택된 item 전체를 부모에게 전달
  state.relatedSearchList = []
  state.isOpen = false //선택하면 창 닫기
}

const handleKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    if (state.relatedSearchList.length === 0) return
    state.selectedIndex = (state.selectedIndex + 1) % state.relatedSearchList.length
  } else if (e.key === 'ArrowUp') {
    if (state.relatedSearchList.length === 0) return
    state.selectedIndex = (state.selectedIndex - 1 + state.relatedSearchList.length) % state.relatedSearchList.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (state.selectedIndex >= 0) {
      selectItem(state.relatedSearchList[state.selectedIndex])  // 리스트에서 선택
    } else {
      emit('update:modelValue', props.modelValue)
      emit('enter', props.modelValue)   // 부모에게 엔터 신호
      state.isOpen = false
    }
  }
}


//아래코드부터는 강의개설에 필요한 것들 !!
const searchContainer = ref(null);

// 핵심: 검색 로직을 함수로 분리
const filterList = (query) => {
  if (!query) {
    // 입력값이 없으면 전체 List를 보여줌 (쫘라락 기능)
    state.relatedSearchList = [...props.list];

  } else {

    // 입력값이 있으면 기존처럼 필터링 (초성 포함)
    state.relatedSearchList = props.list.filter(item => {
      const target = item[props.labelKey] || '';
      if (isChosung(query)) return getChosung(target).includes(query)
      return target.toLowerCase().includes(query.toLowerCase())
    })
  }
}

// 클릭(Focus) 시 실행될 함수
const onFocus = () => {
// 부모가 준 데이터(props.list)가 아예 없거나 0개면 절대 열지 마!
  if (!props.list || props.list.length === 0) {
    state.isOpen = false;
    state.relatedSearchList = [];
    return;
  }
  // showOnFocus가 true일 때만 클릭시 전체목록 표시
  if (props.showOnFocus) {
    state.isOpen = true
    filterList(props.modelValue)
  }
};

// 바깥 클릭 시 닫기 로직
const handleClickOutside = (e) => {
  if (searchContainer.value && !searchContainer.value.contains(e.target)) {
    state.isOpen = false
  }
}
// 컴포넌트가 화면에 나타날 때(마운트될 때) 브라우저 전체에 클릭 감시자 등록
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 컴포넌트가 사라질 때(언마운트될 때) 감시자 제거 (메모리 누수 방지)
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})


</script>

<template>
  <div class="search-input-wrap" ref="searchContainer">
    <input type="search" :placeholder="placeholder" :value="modelValue" @input="onInput" @keydown="handleKeydown" @focus="onFocus"/>
    <div class="relate" v-if="state.isOpen && state.relatedSearchList && state.relatedSearchList.length > 0">
      <div v-for="(item, idx) in state.relatedSearchList" :key="item[valueKey]"
        :class="['idx', { active: idx === state.selectedIndex }]" @click="selectItem(item)">
        {{ item[labelKey] }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 검색 결과 리스트 */
.search-input-wrap { position: relative;}

.relate { position: absolute; top: 100%; left: 0; width: 100%; background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); z-index: 100; max-height: 200px; overflow-y: auto;}
.idx {
  padding: 10px 15px; cursor: pointer;
  &:hover,
  &.active { background: var(--hover-bg-color); color: var(--main-color);}
}
</style>
