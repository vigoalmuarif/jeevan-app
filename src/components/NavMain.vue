<script setup lang="ts">
import type { LucideIcon } from "@lucide/vue";
import { ChevronRight, BookOpen } from "@lucide/vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { MenuNode } from "@/core/types/menu.types";
import * as LucideIcons from '@lucide/vue'
import { useRoute } from "vue-router";

defineProps<{
  items: MenuNode[];
}>();

const route = useRoute()

/**
 * Resolve icon string → lucide component
 * item.icon berupa string e.g. 'Package', 'Tag', 'Warehouse'
 */
function resolveIcon(iconName?: string) {
  if (!iconName) return null
  return (LucideIcons as Record<string, any>)[iconName] ?? null
}
 
/**
 * Cek apakah group punya child yang aktif
 * → dipakai untuk default open state Collapsible
 */
function hasActiveChild(item: MenuNode): boolean {
  return item.children?.some(child => route.name === child.routeName) ?? false
}
 
/**
 * Cek apakah leaf item aktif
 */
function isActive(item: MenuNode): boolean {
  return route.name === item.routeName
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>Menu</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in items" :key="item.key">
       <!-- ── Group node: punya children → Collapsible ──────────────── -->
        <Collapsible
          as-child
          class="group/collapsible"
          :default-open="hasActiveChild(item)"
          v-if="item.children?.length"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.label">
                <component :is="resolveIcon(item.icon)" v-if="item.icon" />
                <span>{{ item.label }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="child in item.children"
                  :key="child.label"
                >
                  <SidebarMenuSubButton :is-active="isActive(child)" as-child>
                    <RouterLink :to="{ name: child.routeName }">
                      <span>{{ child.label }}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <!-- ── Leaf node: tidak punya children → RouterLink langsung ─── -->
        <SidebarMenuItem v-else>
          <SidebarMenuButton  :is-active="isActive(item)" as-child>
            <routerLink :to="{ name: 'dashboard' }">
              <component :is="resolveIcon(item.icon)" v-if="item.icon" />
              <span>Dashboard</span>
            </routerLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
