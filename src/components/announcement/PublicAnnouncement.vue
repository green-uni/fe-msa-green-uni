<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AnnouncementService from '@/services/announcementService'

const router   = useRouter()
const annoList = ref([])

onMounted(async () => {
    try {
        const res = await AnnouncementService.getPublicList({ page: 1, size: 5 })
        annoList.value = res.content ?? []
    } catch (e) {
        console.error(e)
    }
})

const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''
</script>

<template>
    <section class="notice">
      <header class="notice__head">
        <h2>공지사항</h2>
        <a href="#" class="link-more" @click.prevent="router.push('/public/announcements')">더보기 +</a>
      </header>
      <ul class="notice__list">
        <li v-if="annoList.length === 0">
          <span style="color:#aaa; font-size:0.85rem;">공지사항이 없습니다.</span>
        </li>
        <li v-for="anno in annoList" :key="anno.annoId">
          <a href="#" @click.prevent="router.push(`/public/announcements/${anno.annoId}`)">{{ anno.title }}</a>
          <time>{{ formatDate(anno.createdAt) }}</time>
        </li>
      </ul>
    </section>
</template>

<style scoped lang="scss">
a { color: inherit; text-decoration: none; }
.notice {
  border-top: 1px solid rgba(128, 128, 128, 0.25);
  padding-top: 22px;

  &__head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;

    h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      &::before {
        content: "";
        display: inline-block;
        width: 6px; height: 14px;
        background: #2d8659;
        border-radius: 2px;
        margin-right: 8px;
        vertical-align: -2px;
      }
    }

    .link-more {
      font-size: 12px;
      opacity: 0.5;
      transition: opacity 0.15s;
      &:hover { opacity: 1; }
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 9px 4px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.2);
      opacity: 0.9;
      font-size: 14px;

      &:last-child { border-bottom: 0; }

      a {
        min-width: 0;
        flex: 1;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        transition: color 0.15s;
        &:hover { color: $green-600; }
      }
      time {
        font-size: 12px;
        opacity: 0.55;
        flex: 0 0 auto;
      }
    }
  }
}
</style>