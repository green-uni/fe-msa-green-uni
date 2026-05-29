<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { routes } from '@/router/routes';

const route = useRoute();

const isAdmin = computed(() => route.path.startsWith('/admin'));
const prefix = computed(() => isAdmin.value ? '/admin/' : '/');

const groupTitle = computed(() => route.meta?.groupTitle);
const groupLink = computed(() => {
  const root = routes
    .filter(r => r.path === (isAdmin.value ? '/admin/' : '/'))
    .flatMap(r => r.children || []);
  const match = root.find(r =>
    r.meta?.groupTitle === groupTitle.value &&
    r.meta?.navSection === route.meta?.navSection &&
    r.meta?.showInNav !== false
  );
  return match ? prefix.value + match.path : null;
});

const subTitle = computed(() => route.meta?.subTitle);
const subTitleLink = computed(() =>
  route.meta?.activeMenu ? prefix.value + route.meta.activeMenu : null
);
const title = computed(() => route.meta?.title);
</script>

<template>
  <ul class="location">
    <li>
      <router-link v-if="groupLink" :to="groupLink">{{ groupTitle }}</router-link>
      <span v-else>{{ groupTitle }}</span>
    </li>
    <li v-if="subTitle"><font-awesome-icon icon="fa-solid fa-angle-right" /></li>
    <li v-if="subTitle">
      <router-link v-if="subTitleLink" :to="subTitleLink">{{ subTitle }}</router-link>
      <span v-else>{{ subTitle }}</span>
    </li>
    <li><font-awesome-icon icon="fa-solid fa-angle-right" /></li>
    <li class="pageTitle">{{ title }}</li>
  </ul>
</template>

<style scoped lang="scss">
.location{
  padding:0 20px;display: flex;color:$font-color-light;display: inline-flex;align-items: center;gap: 5px;border-bottom: 1px solid $border-color; background: #fff;
    li{
        position: relative;
        &.pageTitle{color:$font-color; font-weight: bold;}
        svg{font-size: .8em;}
        a { color: inherit; text-decoration: none; &:hover { color: $green-600; text-decoration: underline; } }
    }
}
</style>
