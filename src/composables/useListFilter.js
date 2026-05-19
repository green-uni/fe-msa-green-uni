import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const storageKey = (path) => `listFilter:${path}`

export function useListFilter(initialFilter) {
  const route = useRoute()
  const router = useRouter()

  const filter = reactive({ ...initialFilter })
  const searchQuery = ref('')
  const searchInput = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const pageSizeOptions = [10, 20, 50]

  const hasFilter = computed(() =>
    Object.values(filter).some(v => v !== '') || !!searchInput.value
  )

  const pushQuery = () => { // 필터 쿼리 추가
    const filterQuery = Object.fromEntries(
      Object.entries(filter).filter(([, v]) => v !== '')
    )
    const query = { ...filterQuery, search: searchInput.value || undefined, page: currentPage.value }
    // sessionStorage에 현재 쿼리 저장
    sessionStorage.setItem(storageKey(route.path), JSON.stringify(query))
    router.push({ path: route.path, query })
  }

  const onFilterChange = () => { currentPage.value = 1; pushQuery() }

  const onSearch = () => { // 검색
    searchInput.value = searchQuery.value
    currentPage.value = 1
    pushQuery()
  }

  const resetFilter = () => { // 필터 초기화
    Object.keys(filter).forEach(k => (filter[k] = ''))
    searchQuery.value = ''
    searchInput.value = ''
    currentPage.value = 1
    sessionStorage.removeItem(storageKey(route.path))
    router.push({ path: route.path })
  }

  const goToPage = (page) => {
    currentPage.value = page
    const query = { ...route.query, page }
    sessionStorage.setItem(storageKey(route.path), JSON.stringify(query))
    router.push({ path: route.path, query })
  }

  const onPageSizeChange = () => { currentPage.value = 1 }

  // filteredList를 받아 pagedList, maxPage를 반환하는 헬퍼
  const paginate = (filteredList) => ({
    pagedList: computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      return filteredList.value.slice(start, start + pageSize.value)
    }),
    maxPage: computed(() => Math.ceil(filteredList.value.length / pageSize.value) || 1),
  })

  watch(
    () => route.query,
    (q) => {
      // 쿼리 없이 진입한 경우(상세→목록 뒤로가기 등) sessionStorage에서 복원
      if (Object.keys(q).length === 0) {
        const stored = sessionStorage.getItem(storageKey(route.path))
        if (stored) {
          router.replace({ path: route.path, query: JSON.parse(stored) })
          return
        }
      }

      Object.keys(filter).forEach(k => {
        const val = q[k]
        if (val === undefined) { filter[k] = ''; return }
        filter[k] = typeof initialFilter[k] === 'number' ? Number(val) : val
      })
      searchQuery.value = q.search || ''
      searchInput.value = q.search || ''
      currentPage.value = q.page ? Number(q.page) : 1
    },
    { immediate: true, deep: true }
  )

  return {
    filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
    hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, pushQuery, paginate,
  }
}
