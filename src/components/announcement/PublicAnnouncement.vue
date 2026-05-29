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
        <a href="#" class="link-muted" @click.prevent="router.push('/public/announcements')">더보기 +</a>
      </header>
      <ul class="notice__list">
        <li v-if="annoList.length === 0">
          <span style="color:#aaa; font-size:0.85rem;">공지사항이 없습니다.</span>
        </li>
        <li v-for="anno in annoList" :key="anno.annoId">
          <a href="#" @click.prevent="router.push(`/public/announcements/${anno.annoId}`)">
            <span class="dot"></span>{{ anno.title }}
          </a>
          <time>{{ formatDate(anno.createdAt) }}</time>
        </li>
      </ul>
    </section>
</template>

<style scoped lang="scss">
a { color: inherit; text-decoration: none; }
.notice {
  border-top: 1px dashed #e3eae6;
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
      padding: 10px 0;
      border-bottom: 1px solid #e3eae6;
      font-size: 14px;

      &:last-child { border-bottom: 0; }

      a {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;

        &:hover {}
      }
      .dot {
        width: 5px; height: 5px; border-radius: 50%;
        flex: 0 0 auto;
      }
      time {
        font-size: 12.5px;
        flex: 0 0 auto;
      }
    }
  }
}
</style>