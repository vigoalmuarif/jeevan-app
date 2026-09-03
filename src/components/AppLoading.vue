<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLoadingStore } from "@/core/stores/loading.store";
import { Spinner } from "./ui/spinner";

const loadingStore = useLoadingStore();
</script>


<template>
  <AlertDialog :open="loadingStore.open">
    <AlertDialogContent class="sm:max-w-[270px]">
      <AlertDialogHeader>
        <AlertDialogTitle></AlertDialogTitle>
        <AlertDialogDescription>
          <div class="flex flex-col items-center gap-4 py-4">
            <Spinner class="size-8 text-primary" />

            <p class="text-sm text-muted-foreground">
              {{ loadingStore.message }}
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <!-- <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Continue</AlertDialogAction>
      </AlertDialogFooter> -->
    </AlertDialogContent>
  </AlertDialog>
</template>
