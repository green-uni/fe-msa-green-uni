<script setup>
</script>

<template>
    <section class="notice">
      <header class="notice__head">
        <h2>공지사항</h2>
        <a href="#" class="link-muted">더보기 +</a>
      </header>
      <ul class="notice__list">
        <li><a href="#"><span class="dot"></span>2026학년도 2학기 수강신청 일정 안내</a><time>2026-05-15</time></li>
        <li><a href="#"><span class="dot"></span>여름계절수업 개설 교과목 공고</a><time>2026-05-08</time></li>
        <li><a href="#"><span class="dot"></span>교내 장학금 신청 기간 안내 (1차)</a><time>2026-05-02</time></li>
        <li><a href="#"><span class="dot"></span>학사시스템 정기 점검 안내 (5/20 02:00~04:00)</a><time>2026-04-28</time></li>
        <li><a href="#"><span class="dot"></span>2026학년도 교직과정 이수예정자 선발 결과</a><time>2026-04-27</time></li>
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