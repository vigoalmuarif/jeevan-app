// composables/useBreadcrumb.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useBreadcrumb() {
  const route = useRoute()

  const breadcrumbs = computed(() =>
    route.matched
      .filter(r => r.meta?.breadcrumb)
      .map(r => ({
        label: r.meta.breadcrumb as string,
        path: r.path || '/',
      }))
  )

  return { breadcrumbs }
}