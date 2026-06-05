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
  : ['홈', '학사정보', '커뮤니티', '나의 정보']

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
    <section class="nav">

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
      <p class="name">{{ authStore.name }}</p>
      <div class="login-info-detail">
        <p class="member-code">{{ authStore.memberCode }}</p>
        <p class="major" v-if="authStore.major">{{ authStore.major }}</p>
        <p class="student-info" v-if="authStore.role == 'STUDENT'">{{ authStore.academicYear }}학년 {{ authStore.semester }}학기</p>
        <p class="status">
          {{ STATUS_LABEL[role][authStore.status] }}
        </p>
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

    <nav v-if="!isMobile">
      <div v-for="section in menus" :key="section.sectionTitle" class="nav-section">
        <p class="section-label">{{ section.sectionTitle }}</p>

        <div v-for="group in section.groups" :key="group.title" class="group">

          <!-- 단일 메뉴 -->
          <router-link
            v-if="group.isSingle"
            :to="group.path"
            class="group-title single"
            :class="{ active: group.path === activePath }">
            <span><i></i>{{ group.title }}</span>
          </router-link>

          <!-- 복수 메뉴 -->
          <template v-else>
            <div class="group-title d-flex jc-space-b ai-center"
              @click="toggleMenu(group)"
              :class="{
                'is-open': group.isOpen,
                'has-active': group.subMenus.some(s => s.path === activePath)
              }">
              <span><i></i>{{ group.title }}</span>
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
  </section>

  <section class="logout">
    <a @click.prevent="doLogOut" class="pointer"><font-awesome-icon icon="fa-solid fa-right-from-bracket" /> 로그아웃</a>
  </section>
  </div>
</template>

<style scoped lang="scss">
// ── 공통 레이아웃 ────────────────────────────────────────────
.left-nav {
  grid-row: 1 / -1; padding: 20px 15px; position: relative; display: flex; flex-direction: column; justify-content: space-between;
  &.academic { background: #fff; border-right: 1px solid $border-color; }
}
.nav{display: flex; flex-direction: column; gap: 12px;}

// ── 로고 영역 ──────────────────────────────────────────────
.uni-title {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  img { height: 42px; }
  &-name { line-height: 1.25;
    h1 { font-size: 20px; font-weight: 700; }
    span { font-size: $fs-xs; opacity: 0.6; }
  }
}

// ── 로그인 정보 카드 ────────────────────────────────────────
.login-info {
  padding: 14px 15px; border-radius: 8px; background: linear-gradient(140deg, $green-600 0%, $green-700 100%); color: #fff; position: relative;

  .name { font-size: $fs-xl; font-weight: 700; line-height: 1.3;
    .role { font-size: $fs-xs; opacity: 0.75; font-weight: 400; margin-left: 4px; }
  }
  &-detail {
    display: flex; flex-wrap: wrap; gap: 3px 6px; margin-top: 5px; font-size: $fs-xs;
    .member-code { width: 100%; opacity: 0.75; font-variant-numeric: tabular-nums; }
    .major { opacity: 0.75; }
    .student-info{opacity: 0.9;}
    .status { font-weight: 600; opacity: 0.95; }
  }
}
.bell-wrap {
  position: absolute; top: 12px; right: 12px;
  .bell-btn {
    position: relative; background: none; border: 1px solid rgba(#fff, 0.4); border-radius: 6px; padding: 4px; color: #fff; font-size: 1rem; cursor: pointer; opacity: 0.8; transition: opacity 0.15s;
    &:hover { opacity: 1; }
  }
  .badge {
    position: absolute; top: -5px; right: -7px; background: #e74c3c; color: #fff; font-size: $fs-xs; font-weight: 700;  border-radius: 10px; padding: 1px 5px; line-height: 1.5; pointer-events: none;
  }
}

// ── 로그아웃 ──────────────────────────────────────────────
.logout {
  text-align: center; font-size: $fs-xs; opacity: 0.7; font-weight: 500; transition: opacity 0.15s;
  a { display: block; padding: 6px; border: 1px solid #ddd; border-radius: 6px; text-decoration: none; color: inherit; }
  &:hover { opacity: 1; background: rgba(#000, 0.04);}
}

// ── 네비게이션 ────────────────────────────────────────────
nav {
  display: flex; flex-direction: column; gap: 14px;padding: 0 3px;

  .nav-section { display: flex; flex-direction: column; gap: 1px; }
  .section-label {
    margin: 0; padding: 2px 10px 5px; font-size: $fs-xs; font-weight: 700; letter-spacing: 0.05em;    text-transform: uppercase; opacity: 0.28; color: inherit;
  }

  .group { display: flex; flex-direction: column; }
  .group-title {
    display: flex; align-items: center; height: 38px; padding: 0 10px; font-weight: 500; line-height: 1; text-decoration: none; color: inherit; border-radius: 5px; cursor: pointer; transition: background 0.12s, color 0.12s;

    > span:first-child { display: inline-flex; align-items: center; flex: 1; }
    i {
      display: inline-block; flex-shrink: 0; width: 4px; height: 4px; border-radius: 50%; background: $green-600; opacity: 0; margin-right: 0;   transition: opacity 0.15s, margin-right 0.15s;
    }
    svg { font-size: 0.75em; opacity: 0.3; }

    &:hover { background: rgba(#000, 0.04); }

    &.single.active {
      background: rgba(#000, 0.04);
      color: $green-600; font-weight: 600;
      i { opacity: 1; margin-right: 8px; }
    }

    &.is-open {
      background: rgba(#000, 0.04);
      border-radius: 8px 8px 0 0;
      svg { opacity: 0.55; }
    }

    &.has-active {
      color: $green-600; font-weight: 600;
      i { opacity: 1; margin-right: 8px; }
    }

    &.is-open.has-active {
      background: rgba(#000, 0.04);
      border-radius: 8px 8px 0 0;
    }
  }

  // 서브메뉴
  .sub-menu {
    background: rgba(#000, 0.03); border-radius: 0 0 8px 8px; overflow: hidden; margin-bottom: 2px;
    a {
      display: flex; justify-content: space-between; align-items: center; padding: 8px 12px 8px 20px;   font-size: $fs-sm; text-decoration: none; color: $font-color-light; transition: color 0.12s, background 0.12s, border-color 0.12s;
      &:hover { color: $font-color; background: rgba(#000, 0.03); }
      &.active {
        color: $green-600; font-weight: 600; background: rgba(#000, 0.03);
      }
      &.plan { opacity: 0.4; }
    }
  }
}

// ── 관리자 다크 테마 ──────────────────────────────────────
.left-nav.admin {
  background: $admin-default-bg; color: $admin-font-color;
  .uni-title { color: #fff; }
  .login-info {
    background: linear-gradient(140deg, $admin-default-bg 0%, $admin-default-bg2 100%); border: 1px solid $green-700; color: $admin-font-color;
    .name { color: #fff; }
  }
  nav {
    .group-title {
      i { background: $green-400; }
      &:hover { background: rgba(#fff, 0.07); }
      &.single.active { color: $green-400; font-weight: 600; }
      &.is-open { background: rgba(#fff, 0.07); border-radius: 8px 8px 0 0; }
      &.has-active { color: $green-400; font-weight: 600; }
      &.is-open.has-active { background: rgba(#fff, 0.07); }
    }
    .sub-menu {
      background: rgba(#000, 0.2);
      a {
        color: rgba(#fff, 0.45);
        &:hover { color: rgba(#fff, 0.85); background: rgba(#fff, 0.05); }
        &.active { color: $green-400; border-left-color: $green-400; font-weight: 600; }
      }
    }
  }
}
</style>
