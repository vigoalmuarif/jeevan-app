<script lang="ts">
export const description = "A sidebar that collapses to icons.";
export const iframeHeight = "800px";
export const containerClass = "w-full h-full";
</script>

<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { onMounted, ref } from "vue";
import { useBreadcrumb } from "@/core/composables/useBreadcrumb";
import { useMediaQuery } from "@vueuse/core";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoadingStore } from "@/core/stores/loading.store";
import { useMerchantStore } from "../stores/merchant.store";

const loadingStore = useLoadingStore();
const merchantStore = useMerchantStore();
const { breadcrumbs } = useBreadcrumb();

const ITEMS_TO_DISPLAY = 3;
const open = ref(false);
const isDesktop = useMediaQuery("(min-width: 768px)");


onMounted(async () => {
  loadingStore.hide();
  if(merchantStore.isWelcome){
    alert('Selamat Datang Bro..')
  }

});


</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <!-- Selalu tampilkan item PERTAMA -->
              <BreadcrumbItem>
                <BreadcrumbLink as-child>
                  <RouterLink :to="breadcrumbs[0]?.path || '/'">
                    {{ breadcrumbs[0]?.label }}
                  </RouterLink>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <!-- Hanya tampilkan sisanya jika ada lebih dari 1 item -->
              <template v-if="breadcrumbs.length > 1">
                <BreadcrumbSeparator />

                <!-- Jika terlalu panjang: tampilkan ellipsis -->
                <template v-if="breadcrumbs.length > ITEMS_TO_DISPLAY">
                  <BreadcrumbItem>
                    <template v-if="isDesktop">
                      <DropdownMenu v-model:open="open">
                        <DropdownMenuTrigger
                          class="flex items-center gap-1"
                          aria-label="Toggle menu"
                        >
                          <BreadcrumbEllipsis class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            v-for="(item, index) in breadcrumbs.slice(1, -1)"
                            :key="index"
                          >
                            <RouterLink :to="item.path || '#'">{{
                              item.label
                            }}</RouterLink>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </template>
                    <template v-else>
                      <Drawer v-model:open="open">
                        <DrawerTrigger aria-label="Toggle Menu">
                          <BreadcrumbEllipsis class="h-4 w-4" />
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader class="text-left">
                            <DrawerTitle>Navigate to</DrawerTitle>
                            <DrawerDescription
                              >Select a page to navigate to.</DrawerDescription
                            >
                          </DrawerHeader>
                          <div class="grid gap-1 px-4">
                            <RouterLink
                              v-for="(item, index) in breadcrumbs.slice(1, -1)"
                              :key="index"
                              :to="item.path || '#'"
                              class="py-1 text-sm"
                            >
                              {{ item.label }}
                            </RouterLink>
                          </div>
                          <DrawerFooter class="pt-4">
                            <DrawerClose as-child>
                              <Button variant="outline">Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </template>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </template>

                <!-- Tampilkan sisa item (slice(1) jika pendek, slice terakhir jika panjang) -->
                <template
                  v-for="(item, index) in breadcrumbs.length > ITEMS_TO_DISPLAY
                    ? breadcrumbs.slice(-ITEMS_TO_DISPLAY + 1)
                    : breadcrumbs.slice(1)"
                  :key="index"
                >
                  <BreadcrumbItem>
                    <!-- Item terakhir = halaman aktif -->
                    <BreadcrumbPage
                      v-if="
                        index ===
                        (breadcrumbs.length > ITEMS_TO_DISPLAY
                          ? ITEMS_TO_DISPLAY - 2
                          : breadcrumbs.length - 2)
                      "
                      class="max-w-20 truncate md:max-w-none"
                    >
                      {{ item.label }}
                    </BreadcrumbPage>
                    <!-- Bukan terakhir = link -->
                    <BreadcrumbLink
                      v-else
                      as-child
                      class="max-w-20 truncate md:max-w-none"
                    >
                      <RouterLink :to="item.path">{{ item.label }}</RouterLink>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator
                    v-if="
                      index <
                      (breadcrumbs.length > ITEMS_TO_DISPLAY
                        ? ITEMS_TO_DISPLAY - 2
                        : breadcrumbs.length - 2)
                    "
                  />
                </template>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div class="p-4">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
