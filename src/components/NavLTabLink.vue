<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu'
import type { LucideIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';


const props = defineProps<{
  tabs: {
    name: string
    label: string
    url: string
    icon?: LucideIcon
    }[]
}>()

const route = useRoute();
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList>
    <NavigationMenuItem v-for="tab in tabs" :key="tab.name" >
        <NavigationMenuLink as-child :class="navigationMenuTriggerStyle()" :aria-current="route.path === tab.url" :active="route.path === tab.url">
          <RouterLink :to="tab.url">{{  tab.name  }}</RouterLink>
        </NavigationMenuLink>
        <NavigationMenuIndicator class="NavigationMenuIndicator" />
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
