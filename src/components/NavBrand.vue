<script setup lang="ts">
import type { Component } from "vue";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const props = defineProps<{
  merchant: {
    name?: string;
    logo: Component;
    plan?: string;
  };
}>();
</script>

<template>
  <SidebarMenu class="bg-muted rounded-xl">
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <div
          class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
        >
          <component :is="merchant.logo" class="size-4" />
        </div>
        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">
            {{ merchant.name }}
          </span>
          <span class="truncate text-xs">{{ merchant.plan }}</span>
        </div>
        <!-- <ChevronsUpDown class="ml-auto" /> -->
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
