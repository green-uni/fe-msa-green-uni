<script setup>
import logo from '@/assets/logo.png';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { routes } from '@/router/routes'
import { useAuthStore } from '@/stores/authentication';
import AuthService from '@/services/authService';
import NotificationService from '@/services/notificationService';
import { STATUS_LABEL } from '@/utils/constants.js'

const authStore = useAuthStore()
const route = useRoute();
const router = useRouter();
const role = authStore.role
const menus = ref([]);
const isAdmin = route.path.startsWith('/admin');
const isMobile = route.path.startsWith('/attend');

const doLogOut = async () => {
  try {
    await AuthService.logOut();
    authStore.logOut();
    await router.push(role === 'ADMIN' ? '/admin/login' : '/login')
  } catch (e) {
    console.error(e)
  }
}

let userRole = '';
if (authStore.role == 'ADMIN') { userRole = '관리자' }
else if (authStore.role == 'PROFESSOR') { userRole = '교수' }
else { userRole = '학생' }

// 최초 미읽음 수 로드
onMounted(async () => {
  if (!isMobile) {
    try {
      NotificationService.unreadCount.value = await NotificationService.getUnreadCount()
    } catch (e) { console.error(e) }
  }
})

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

const activePath = computed(() => {
  if (route.meta?.activeMenu) {
    return (isAdmin ? '/admin/' : '/') + route.meta.activeMenu
  }
  return route.path
})

const updateMenuState = () => {
  menus.value.forEach(menu => {
    const presentMenu = menu.subMenus.some(sub => sub.path === activePath.value);
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
});

watch(() => route.path, () => {
  updateMenuState();
});
</script>

<template>
  <div class="left-nav" :class="isAdmin ? 'admin' : 'academic'">
    <div class="login-info">
      <p class="name">{{ authStore.name }}</p>
      <div class="login-info-detail">
        <p class="member-code">{{ authStore.memberCode }}</p>
        <p class="major" v-if="authStore.major">{{ authStore.major }}</p>
        <p class="status">{{ STATUS_LABEL[role][authStore.status] }}</p>
      </div>

      <div v-if="!isMobile" class="bell-wrap">
        <button class="bell-btn"
          @click="NotificationService.isPanelOpen.value = !NotificationService.isPanelOpen.value">
          <font-awesome-icon icon="fa-solid fa-bell" />
          <span v-if="NotificationService.unreadCount.value > 0" class="badge">
            {{ NotificationService.unreadCount.value > 99 ? '99+' : NotificationService.unreadCount.value }}
          </span>
        </button>
      </div>
    </div>
    <section class="logout">
      <a @click.prevent="doLogOut" class="pointer"><font-awesome-icon icon="fa-solid fa-right-from-bracket" /> 로그아웃</a>
    </section>    
    <nav v-if="!isMobile">
      <div v-for="menu in menus" :key="menu.title" class="group">
        <div class="group-title d-flex jc-space-b ai-center" @click="toggleMenu(menu)"
          :class="{ 'active': menu.isOpen }">
          <span>{{ menu.title }}</span>

          <span class="arrow">
            <font-awesome-icon :icon="menu.isOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']" />
          </span>
        </div>

        <div v-show="menu.isOpen" class="sub-menu">
          <router-link :to="sub.path" v-for="sub in menu.subMenus" :key="sub.title"
            :class="{ active: sub.path === activePath, plan: sub.planTitle }">
            <span>{{ sub.title }}</span>
            <span v-if="sub.planTitle">
              <font-awesome-icon icon="fa-solid fa-check-double" />
            </span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.left-nav {
  padding: 20px 15px; position: relative;
  &.academic { background: #fff; border-right: 1px solid $line-color; }
}
.login-info {
  padding: 15px; border-radius: 10px; background: linear-gradient(140deg, $green-600 0%, $green-700 100%); color: #fff; position: relative;
  .name { font-weight: 700;font-size: 1.2em; }
  &-detail { display: flex; font-size: 0.9em; gap: 2px; flex-wrap: wrap;
    .member-code { width: 100%;   font-size: 12px; opacity: 0.85; margin-top: 2px;  font-variant-numeric: tabular-nums;    }
    .major {opacity: 0.8;}
    .status {opacity: 1;font-weight: 500;}
  }
}
.bell-wrap { position: absolute;top: 10px;right: 10px;
  .bell-btn { position: relative;  background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: .6;  padding: 4px;color: #fff; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 5px;
    &:hover { opacity: 1; }
  }
  .badge { position: absolute; top: -4px; right: -6px; background: #e74c3c; color: #fff; font-size: .65rem;  font-weight: 700; border-radius: 10px; padding: 1px 5px;  line-height: 1.4;  pointer-events: none
  }
}
nav {
  display: flex; flex-direction: column; gap: 5px;
  .group { display: flex; flex-direction: column; gap: 5px; }
  .group-title {
    padding: 5px 7px 5px 10px; cursor: pointer; height: 40px; font-weight: 500;
    svg {font-size: .8em;}
    &.active {
      background-color: $green-500;  border-radius: 5px;  font-weight: 500;
      span { color: #fff; opacity: 1; }
      }
    }
  .sub-menu { border-radius: 5px; overflow: hidden; background: $default-bg;
    a { text-decoration: none;  display: flex;  justify-content: space-between;  padding: 10px;color: $font-color-light; 
      &:hover { color: $font-color }
      &.active { background-color: var(--hover-bg-color); color: var(--main-color);font-weight: bold;}
      &.plan { opacity: .6;}
    }
    &.active {display: block; }
    }
}
.logout{ margin:10px 0; text-align: center;font-size: .9em;opacity: .5;font-weight: 500;
  a{ border: 1px solid #ccc;display: block;padding: 5px;border-radius: 5px;} 
  &:hover{opacity: 1;}
}

// ---------- 관리자 페이지 디자인  ----------
.left-nav.admin {background: $admin-default-bg;color: $admin-font-color;
  .login-info{border: 1px solid $green-700;background: linear-gradient(140deg, $admin-default-bg 0%, $admin-default-bg2 100%);color: $admin-font-color;
    .name{color: #fff;}
  }
  .group-title{
    &.active{background:$green-700;}
  }
  .sub-menu{
    background:none;
    a{ opacity: 0.5;
      &:hover { color:#fff ;opacity: 1;}
      &.active{background: rgba(0,0,0,0.2);opacity: 1;}
    }
  }
}
</style>
