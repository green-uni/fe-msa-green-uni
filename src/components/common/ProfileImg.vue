<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  memberCode: [Number, String],
  clsValue: String,
  size: Number,
  pic: { type: [String, File], default: null },
  existPic: String,    // 기존 이미지 파일명
  editable: { type: Boolean, default: false }  // 수정 가능 여부
})

const emit = defineEmits(['update:pic'])

const fileInput = ref(null)
const previewUrl = ref(null)
const sizeError = ref(false)
const imgLoadError = ref(false)

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// 이미지 주소: 기존 사진 or 미리보기 or 빈값
const imgSrc = computed(() => {
  if (previewUrl.value) return previewUrl.value  // 새로 선택한 이미지
  if (props.existPic && props.memberCode) return `/file/member/${props.memberCode}/${props.existPic}`  // 기존 이미지
  return ''  // 없음
})

watch(imgSrc, () => { imgLoadError.value = false })

const openFileSelector = () => {
  if (props.editable) fileInput.value.click()
}

const handlePicChanged = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > MAX_SIZE) {
    sizeError.value = true
    fileInput.value.value = ''
    return
  }
  sizeError.value = false
  const reader = new FileReader()
  reader.onload = (e) => { previewUrl.value = e.target.result }
  reader.readAsDataURL(file)
  emit('update:pic', file)
}
</script>

<template>
  <div class="pf-profile-pic d-flex direct-col g10 w100p">
    <div class="pic-box" :class="{ pointer: editable }" @click="openFileSelector">
      <img v-if="imgSrc && !imgLoadError" :src="imgSrc" @error="imgLoadError = true" />
      <div v-else-if="imgSrc && imgLoadError" class="img-error">
        <font-awesome-icon icon="fa-solid fa-circle-exclamation" />
        <span>사진을 불러오는데<br />실패했습니다</span>
      </div>
      <div v-else class="img-error">
        <font-awesome-icon icon="fa-solid fa-camera" />
        <span>사진을 등록해 주세요</span>
      </div>
    </div>
    <div v-if="editable" @click="openFileSelector" class="btn btn-line point">
      <font-awesome-icon v-if="existPic" icon="fa-solid fa-pen" />
      <font-awesome-icon v-else icon="fa-solid fa-circle-plus" />
      <span>{{ existPic ? '사진 변경' : '사진 등록' }}</span>
      <input ref="fileInput" type="file" accept="image/*" @change="handlePicChanged" style="display:none">
    </div>
    <div v-if="editable" class="pic-hint" :class="{ error: sizeError }">
      <font-awesome-icon icon="fa-solid fa-triangle-exclamation" v-if="sizeError" />
      {{ sizeError ? '5MB 이하의 이미지만 등록 가능합니다.' : '최대 5MB · JPG, PNG, GIF' }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.pf-profile-pic {
  align-items: center;
  input[type="file"] { display: none;}
  .btn { text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;}
}

.pic-hint { font-size: $fs-xs; color: $font-color-light; text-align: center;
  &.error { color: $error; font-weight: 500; }
}

.pic-box { max-width: 160px; width: 100%; aspect-ratio: 3 / 4; border: 1px solid #ddd; background-color: $hover-bg-color; display: flex;  justify-content: center; align-items: center; border-radius: 5px; overflow: hidden;
   img { width: 100%; height: 100%; object-fit: cover;}
    svg { font-size: 5rem; color: $green-600;}
}

.profile-img-wrap:has(.img-error){width: 100%;}
.img-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  color: $font-color-light; text-align: center;
  svg { font-size: 2rem; color: $font-color-light; }
  span { font-size: $fs-xs; line-height: 1.5; }
}
</style>
