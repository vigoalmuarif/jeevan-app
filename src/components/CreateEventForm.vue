<script setup lang="ts">
import { onUnmounted, reactive, type HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from "@/stores/auth"
import FieldError from "./ui/field/FieldError.vue"
import Spinner from "./ui/spinner/Spinner.vue"
import { InfoIcon } from '@lucide/vue'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Textarea from "./ui/textarea/Textarea.vue"
import { useEventStore } from "@/stores/event"
import router from "@/routes"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const data = reactive({
  name: '',
  url: '',
  desc: '',
});

const auth = useAuthStore();
const project = useEventStore();


async function handleStore() {
  await project.storeEvent(data);
  router.push({ name: 'dashboard' });
}

onUnmounted(() => {
  auth.errors = {}
  
})

</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleStore">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">
                Buat Project
              </h1>
              <p class="text-muted-foreground text-sm text-balance">
                Yuk siapkan untuk hari spesialmu
              </p>
            </div>
            <Field :data-invalid="!!project.errors?.name?.length">
              <FieldLabel for="name">
                Nama Project
              </FieldLabel>
              <Input id="name" type="text" placeholder="Rina Love Rino" autocomplete="off" required v-model="data.name"
                aria-invalid />
              <FieldError v-if="!!project.errors?.name?.length">{{ project.errors?.name?.[0] }}</FieldError>
            </Field>

            <Field :data-invalid="!!project.errors?.url?.length">
              <FieldLabel for="url">
                URL Undangan
              </FieldLabel>
              <InputGroup>
                <InputGroupInput placeholder="rina-rino" class="!pl-1" aria-invalid v-model="data.url" />
                <InputGroupAddon>
                  <InputGroupText>menuabersama.com/</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <InputGroupButton class="rounded-full" size="icon-xs">
                          <InfoIcon class="size-4" />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>Tidak boleh mengandung spasi</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </InputGroupAddon>
              </InputGroup>
              <FieldError v-if="!!project.errors?.url?.length">{{ project.errors?.url?.[0] }}</FieldError>
            </Field>

            <Field>
              <FieldLabel for="desc" :optional="true">
                Deskripsi
              </FieldLabel>
              <Textarea placeholder="Tulis deskripsi projectmu" v-model="data.desc" />
            </Field>

            <Field>
              <Button type="submit" :disabled="project.loading">
                <Spinner v-if="project.loading" />
                Simpan Project
              </Button>
            </Field>

          </FieldGroup>
        </form>
        <div class="bg-muted relative hidden md:block">
          <img src="#" alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale">
        </div>
      </CardContent>
    </Card>
    <FieldDescription class="px-6 text-center">
      By clicking continue, you agree to our <a href="#">Terms of Service</a>
      and <a href="#">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
