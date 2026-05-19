import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

  const pushQuery = () => {
    const filterQuery = Object.fromEntries(
      Object.entries(filter).filter(([, v]) => v !== '')
    )
    router.push({
      path: route.path,
      query: { ...filterQuery, search: searchInput.value || undefined, page: currentPage.value },
    })
  }

  const onFilterChange = () => { currentPage.value = 1; pushQuery() }

  const onSearch = () => {
    searchInput.value = searchQuery.value
    currentPage.value = 1
    pushQuery()
  }

  const resetFilter = () => {
    Object.keys(filter).forEach(k => (filter[k] = ''))
    searchQuery.value = ''
    searchInput.value = ''
    currentPage.value = 1
    router.push({ path: route.path })
  }

  const goToPage = (page) => {
    currentPage.value = page
    router.push({ path: route.path, query: { ...route.query, page } })
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
