<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
} from "@lucide/vue";
import NavMain from "@/components/NavMain.vue";
import NavProjects from "@/components/NavProjects.vue";
import NavUser from "@/components/NavUser.vue";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useMerchantStore } from "@/core/stores/merchant.store";
import { useAuthStore } from "@/core/stores/auth.store";
import TeamSwitcher from "./TeamSwitcher.vue";
import { useMenu } from "@/core/composables/useMenu.ts";
import ModeToggle from "./ModeToggle.vue";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

const authStore = useAuthStore();
const merchantStore = useMerchantStore();
const { menu } = useMenu();

// This is sample data.
const data = {
  user: {
    name: authStore?.user?.name,
    email: authStore?.user?.email,
    avatar: "/avatars/shadcn.jpg",
  },
  brand: {
    merchant: {
      name: merchantStore?.merchant?.name,
      logo: GalleryVerticalEnd,
      plan: merchantStore?.subscription?.name,
    },
    branches: merchantStore.branches,
    activeBranch: merchantStore?.activeBranch,
  },
  navMain: menu,
    
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :brand="data.brand" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain.value" />
      <NavProjects :projects="data.projects" />
    </SidebarContent>
    <SidebarFooter>
      <ModeToggle />
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
