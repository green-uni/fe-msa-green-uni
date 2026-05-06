<script setup>
import { useModalStore } from '@/stores/modal';
const modal = useModalStore();
</script>

<template>
  <!--Transition: 엘리먼트나 컴포넌트가 나타나고 사라질 때 애니메이션 효과를 쉽게 적용할 수 있도록 도와주는 내장 컴포넌트-->
  <Transition name="modal-fade">
    <div v-if="modal.isOpen" class="modal-dim" @click.self="modal.close(false)">
      <div class="modal-box">
        <div class="modal-body">
          <div class="modal-icon" :class="modal.type">
            <span v-if="modal.type === 'success'"><font-awesome-icon icon="fa-solid fa-circle-check" /></span>
            <span v-else-if="modal.type === 'error'"><font-awesome-icon icon="fa-solid fa-circle-xmark" /></span>
            <span v-else-if="modal.type === 'warning'"><font-awesome-icon icon="fa-solid fa-triangle-exclamation" /></span>
            <span v-else><font-awesome-icon icon="fa-solid fa-circle-exclamation" /></span>
          </div>
          <div class="modal-message">
            {{ modal.message }}
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="modal.isConfirm" class="btn-cancel" @click="modal.close(false)">취소</button>
          <button class="btn-ok" @click="modal.close(true)">확인</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-dim { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); display: flex;justify-content: center; align-items: center; z-index: 9999;}
.modal-box { background: #fff; width: 550px; border-radius: 8px;  overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);}

.modal-body { padding:40px 30px;display: flex;gap: 25px;flex-direction: column;align-items: center;}

.modal-icon { font-size: 35px;background: #f5f5f5;border-radius: 50%;width:60px;height:60px;display: flex;justify-content: center;align-items: center;border: 1px solid #eee;padding-top: 2px;
  &.success{background-color: var(--success-bg); color: var(--success);border-color: rgba(62, 158, 126, 0.2);}
  &.error{background-color: var(--error-bg);color: var(--error);border-color:rgba(224, 82, 82, 0.2) }
  &.info{background-color:var(--info-bg);color: var(--info);border-color:rgb(74, 144, 226, 0.2) }
  &.warning{background-color:  var(--warning-bg);color: var(--warning);border-color:rgb(217, 144, 0, 0.2) }
}

.modal-message { text-align: center;font-size: var(--text-lg); font-weight: 500; white-space: pre-wrap; color: var(--font-color);}

.modal-footer {
  display: flex; border-top: 1px solid #eee;
  button { flex: 1; border: none; padding: var(--size-xs); cursor: pointer; color: var(--font-color);background: #fff;transition:.2s;
    &.btn-ok {color: var(--main-color);
      &:hover {background: rgb(62, 158, 126,0.05);}
    }
    &.btn-cancel { border-right: 1px solid #eee ;color: #aaa;
      &:hover {background: #fafafa;}
    }
  }
}
/* 애니메이션 */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease;}

.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
</style>
