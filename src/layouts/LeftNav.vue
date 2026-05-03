<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { routes } from '@/router/routes'
import { useAuthStore } from '@/stores/authentication';

const authStore = useAuthStore()
const route = useRoute();
const menus = ref([]);
  const isAdmin = route.path.startsWith('/admin')

const makeMenu = () => {
  const temp = {};
  const role = authStore?.role;

  // children을 전부 꺼내서 하나의 배열로 합치기
  const flatRoutes = routes
    .filter(r => isAdmin ? r.path === '/admin/' : r.path === '/')
    .flatMap(r => r.children || [])

  flatRoutes.forEach(r => {
    const { groupTitle, title, auth } = r.meta || {};
    if (!groupTitle) return; // groupTitle이 없다면 메뉴로 만들지 않음
    if (r.meta?.showInNav === false) return // showInNav: false면 메뉴에서 제외
    if (auth && !auth.includes(role)) return  // 권한 없으면 메뉴에서 제외

    if (!temp[groupTitle]) { //groupTitle이 있다면 임시 객체로 그룹화
      temp[groupTitle] = {
        title: groupTitle,
        isOpen: false,
        subMenus: []
      };
    }
    temp[groupTitle].subMenus.push({ // 그룹 안에 서브메뉴로 작업
      title: title,
      path: (isAdmin ? '/admin/' : '/') + r.path,  // ← / 붙이기
      planTitle: r.meta?.planTitle
    });
  })
  menus.value = Object.values(temp); // 그룹 객체를 배열로 변환
}

const updateMenuState = () => {
  // 현재 경로 또는 activeMenu로 지정된 경로
  const activePath = route.meta?.activeMenu || route.path

  menus.value.forEach(menu => {
    const presentMenu = menu.subMenus.some(sub => sub.path === activePath);
    menu.isOpen = presentMenu
  });
};

const toggleMenu = (targetMenu) => {
  menus.value.forEach(m => {
    if (m === targetMenu) m.isOpen = !m.isOpen;
    else m.isOpen = false;
  });
};

onMounted(() => {
  makeMenu(); // 메뉴 생성
  updateMenuState(); // 현재 경로 활성화
  // console.log(menus.value);
});

watch(() => route.path, () => {
  updateMenuState();
});
</script>

<template>
  <nav :class="isAdmin ? 'admin' : 'academic'">
    <div v-for="menu in menus" :key="menu.title" class="group">
      <div class="group-title d-flex jc-space-b ai-center" @click="toggleMenu(menu)" :class="{ 'active': menu.isOpen }">
        <span>{{ menu.title }}</span>

        <span class="arrow">
          <font-awesome-icon :icon="menu.isOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']" />
        </span>
      </div>

      <div v-show="menu.isOpen" class="sub-menu">
        <router-link :to="sub.path" v-for="sub in menu.subMenus" :key="sub.title"
          :class="{ active: sub.path === (route.meta?.activeMenu || route.path), plan: sub.planTitle }">
          <span>{{ sub.title }}</span>
          <span v-if="sub.planTitle">
            <font-awesome-icon icon="fa-solid fa-check-double" />
          </span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav.admin { background: #fff; }

nav.academic { background: #2c3e50; }
nav {
  padding: 10px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.group-title {
  padding: 5px 18px;
  cursor: pointer;
  height: 55px;
  font-weight: 500;
}

.group-title svg {
  font-size: .8em;
}

.group-title.active span {
  color: var(--font-color);
  opacity: .5;
}

.group-title.active {
  background-color: var(--main-color);
  border-radius: 5px;
  font-weight: 500;
}

.group-title.active span {
  color: #fff;
  opacity: 1;
}

.sub-menu {
  border-radius: 5px;
  overflow: hidden;
}

.sub-menu.active {
  display: block;
}

.sub-menu a {
  text-decoration: none;
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: #F8F9FA;
  color: var(--font-color-light);
}

.sub-menu a:not(:first-child) {
  border-top: 1px solid #eee;
}

.sub-menu a:hover {
  color: var(--font-color)
}

.sub-menu a.active {
  background-color: var(--hover-bg-color);
  color: var(--main-color);
}

.sub-menu a.plan {
  opacity: .6;
}
</style>
