<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const groupTitle = computed(() => route.meta?.groupTitle);
const subTitle = computed(() => route.meta?.subTitle);
const title = computed(() => route.meta?.title);

</script>

<template>
    <ul class="location">
      <li>{{ groupTitle }}</li>
      <li v-if="subTitle"><font-awesome-icon icon="fa-solid fa-angle-right" /></li>
      <li v-if="subTitle">{{ subTitle }}</li>
      <li><font-awesome-icon icon="fa-solid fa-angle-right" /></li>
      <li class="pageTitle">{{ title }}</li>
    </ul>
</template>

<style scoped lang="scss">
.location{
  padding:0 20px;display: flex;color:$font-color-light;display: inline-flex;align-items: center;gap: 5px;border-bottom: 1px solid $border-color;
    li{
        position: relative;
        &.pageTitle{color:$font-color; font-weight: bold;}
        svg{font-size: .8em;}
    }
}
</style>
