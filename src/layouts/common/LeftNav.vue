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
const menus = ref([]);  // [{ sectionTitle, groups: [{ title, isSingle, path, isOpen, subMenus }] }]
const isAdmin = route.path.startsWith('/admin');
const isMobile = route.path.startsWith('/student/');

// 섹션 표시 순서 정의
const SECTION_ORDER = isAdmin
  ? ['나의 정보', '회원 관리', '학사 관리', '재정 관리', '커뮤니티']
  : ['홈', '학사정보', '나의 정보', '커뮤니티']

const doLogOut = async () => {
  try {
    NotificationService.disconnect()
    authStore.logOut()
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
  const sectionMap = {}; // { navSection: { groupTitle: { title, isOpen, subMenus[] } } }
  const currentRole = authStore?.role;

  const flatRoutes = routes
    .filter(r => isAdmin ? r.path === '/admin/' : r.path === '/')
    .flatMap(r => r.children || [])

  flatRoutes.forEach(r => {
    const { navSection, groupTitle, title, auth } = r.meta || {};
    if (!groupTitle) return;                          // groupTitle 없으면 메뉴 제외
    if (r.meta?.showInNav === false) return;          // showInNav: false면 제외
    if (auth && !auth.includes(currentRole)) return;  // 권한 없으면 제외
    if (!navSection) return;                          // navSection 없으면 제외

    if (!sectionMap[navSection]) sectionMap[navSection] = {};
    if (!sectionMap[navSection][groupTitle]) {
      sectionMap[navSection][groupTitle] = {
        title: groupTitle,
        isOpen: false,
        subMenus: []
      };
    }
    sectionMap[navSection][groupTitle].subMenus.push({
      title,
      navTitle: r.meta?.navTitle,
      path: (isAdmin ? '/admin/' : '/') + r.path,
      planTitle: r.meta?.planTitle
    });
  });

  // 섹션 배열 변환 — SECTION_ORDER 순서대로 정렬, 모르는 섹션은 뒤에 추가
  const orderedKeys = [
    ...SECTION_ORDER.filter(s => sectionMap[s]),
    ...Object.keys(sectionMap).filter(s => !SECTION_ORDER.includes(s))
  ];

  menus.value = orderedKeys.map(sectionTitle => ({
    sectionTitle,
    groups: Object.values(sectionMap[sectionTitle]).map(g => ({
      ...g,
      // subMenus가 1개면 accordion 없이 직접 링크
      isSingle: g.subMenus.length === 1,
      path: g.subMenus.length === 1 ? g.subMenus[0].path : null,
    }))
  }));
};

const activePath = computed(() => {
  if (route.meta?.activeMenu) {
    return (isAdmin ? '/admin/' : '/') + route.meta.activeMenu
  }
  return route.path
})

const updateMenuState = () => {
  menus.value.forEach(section => {
    section.groups.forEach(group => {
      if (!group.isSingle) {
        group.isOpen = group.subMenus.some(sub => sub.path === activePath.value);
      }
    });
  });
};

const toggleMenu = (targetGroup) => {
  menus.value.forEach(section => {
    section.groups.forEach(g => {
      if (g === targetGroup) g.isOpen = !g.isOpen;
      else g.isOpen = false;
    });
  });
};

onMounted(() => {
  makeMenu();
  updateMenuState();
});

watch(() => route.path, () => {
  updateMenuState();
});
</script>

<template>
  <div class="left-nav" :class="isAdmin ? 'admin' : 'academic'">

    <div v-if="!isMobile" class="uni-title" @click="router.push(isAdmin? '/admin/members/dashboard' : '/members/dashboard')">
      <img :src="logo" />
      <div class="uni-title-name">
        <h1>그린대학교</h1>
        <span>{{ isAdmin? '학사 관리 시스템' : '종합 정보 시스템' }}</span>
      </div>
    </div>
    <div v-if="isMobile">
      <h1>그린대학교 전자출결 시스템</h1>
    </div>

    <div class="login-info">
      <p class="name">{{ authStore.name }} <span class="role">{{ userRole }}</span></p>
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
      <div v-for="section in menus" :key="section.sectionTitle" class="nav-section">
        <p class="section-label">{{ section.sectionTitle }}</p>

        <div v-for="group in section.groups" :key="group.title" class="group">

          <!-- 단일 메뉴: accordion 없이 router-link 직접 렌더 -->
          <router-link
            v-if="group.isSingle"
            :to="group.path"
            class="group-title single"
            :class="{ active: group.path === activePath }">
            <span>{{ group.title }}</span>
          </router-link>

          <!-- 복수 메뉴: accordion -->
          <template v-else>
            <div class="group-title d-flex jc-space-b ai-center"
              @click="toggleMenu(group)"
              :class="{ active: group.isOpen }">
              <span>{{ group.title }}</span>
              <span class="arrow">
                <font-awesome-icon :icon="group.isOpen ? ['fas', 'angle-up'] : ['fas', 'angle-down']" />
              </span>
            </div>

            <div v-show="group.isOpen" class="sub-menu">
              <router-link
                v-for="sub in group.subMenus"
                :key="sub.title"
                :to="sub.path"
                :class="{ active: sub.path === activePath, plan: sub.planTitle }">
                <span>{{ sub.navTitle || sub.title }}</span>
                <span v-if="sub.planTitle">
                  <font-awesome-icon icon="fa-solid fa-check-double" />
                </span>
              </router-link>
            </div>
          </template>

        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.left-nav {
  grid-row: 1 / -1; padding: 20px 15px; position: relative;
  &.academic { background: #fff; border-right: 1px solid $border-color; }
}
.uni-title{
  display: flex; align-items:center; cursor: pointer; gap:7px; margin-bottom:20px;
  img{height: 45px;}
  &-name{line-height: 1.2;
    h1{font-size: 1.5em;font-weight: bold;}
    span{opacity: 0.8;font-size: 0.95em;margin-left: 2px;}
  }
}
.login-info {
  padding: 15px; border-radius: 10px; background: linear-gradient(140deg, $green-600 0%, $green-700 100%); color: #fff; position: relative;
  .name { font-weight: 700;font-size: 1.4em;
    .role{font-size:.8em;opacity: .8;font-weight: normal; }
  }
  &-detail { display: flex; font-size: 0.9em; gap: 4px; flex-wrap: wrap;
    .member-code { width: 100%;   font-size: .9em; opacity: 0.85; margin-top: 2px;  font-variant-numeric: tabular-nums;    }
    .major {opacity: 0.8;}
    .status {opacity: 1;font-weight: 500;}
  }
}
.bell-wrap { position: absolute;top: 12px;right: 12px;
  .bell-btn { position: relative;  background: none; border: none; font-size: 1.1rem; cursor: pointer; opacity: .6;  padding: 4px;color: #fff; border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 5px;
    &:hover { opacity: 1; }
  }
  .badge { position: absolute; top: -4px; right: -6px; background: #e74c3c; color: #fff; font-size: .65rem;  font-weight: 700; border-radius: 10px; padding: 1px 5px;  line-height: 1.4;  pointer-events: none
  }
}
nav {
  display: flex; flex-direction: column; gap: 2px;

  .nav-section {
    display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px;
  }
  .section-label {
    font-size: 0.75em; font-weight: 600; opacity: 0.45; text-transform: uppercase;
    letter-spacing: 0.05em; padding: 4px 10px 2px; margin: 0;
  }
  .group { display: flex; flex-direction: column; gap: 2px; }
  .group-title {
    padding: 5px 7px 5px 10px; cursor: pointer; height: 40px; font-weight: 500; border-radius: 5px;
    text-decoration: none; color: inherit; display: flex; align-items: center;
    &:hover { background: $green-50; }
    &.active {
      background-color: $green-500; font-weight: 500;
      span { color: #fff; opacity: 1; }
    }
    // 단일 메뉴 active (router-link)
    &.single.active { background-color: $green-500;
      span { color: #fff; }
    }
    svg { font-size: .8em; }
  }
  .sub-menu { border-radius: 5px; overflow: hidden; background: $default-bg;
    a { text-decoration: none; display: flex; justify-content: space-between; padding: 10px; color: $font-color-light;
      &:hover { color: $font-color }
      &.active { background-color: var(--hover-bg-color); color: var(--main-color); font-weight: bold; }
      &.plan { opacity: .6; }
    }
  }
}
.logout{ margin:10px 0; text-align: center;font-size: .9em;opacity: .5;font-weight: 500;
  a{ border: 1px solid #ccc;display: block;padding: 5px;border-radius: 5px;}
  &:hover{opacity: 1;}
}

// ---------- 관리자 페이지 디자인  ----------
.left-nav.admin {background: $admin-default-bg;color: $admin-font-color;
  .uni-title{color: #fff;}
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
