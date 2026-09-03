<script setup lang="ts">
import { onBeforeMount, onMounted, reactive, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ref } from "vue";
import { normalizeError } from "@/lib/errors";
import { Spinner } from "../ui/spinner";
import { toast } from "vue-sonner";
import { authService } from "@/modules/auth/services/auth.service";
import type { RegisterPayload } from "@/core/types/auth.types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useRouter } from "vue-router";
import { useLoadingStore } from "@/core/stores/loading.store";


const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");

const router = useRouter();
const loadingStore = useLoadingStore();

const data = reactive<RegisterPayload>({
  name: "",
  email: "",
  username: "",
  phone: "",
  password: "",
  password_confirmation: "",
});

async function handleRegist() {
  loadingStore.show('Mendaftar 💖')
  loading.value = true;
  errors.value = {};
  generalError.value = "";

  try {
    await authService.register(data);
    router.push({
      name: "auth.login",
      query: {
        isRegistered: "true",
      },
    });
  } catch (e) {
    loadingStore.hide();
    const err = normalizeError(e);
    if (err.type === "validation") {
      toast.error("Oppss..", {
        description: "Ada inputan yang gak valid. Silahkan cek ulang",
        duration: 6000,
      });
      errors.value = err.errors;
    } else {
      generalError.value = err.message;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadingStore.hide();
});
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <div class="bg-neutral-900 relative hidden md:block">
          <!-- <img
            src="#"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          /> -->
        </div>
        <form class="p-6 md:p-8" @submit.prevent="handleRegist()">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">Buat Akun</h1>
              <p class="text-muted-foreground text-balance">
                Saatnya menggunakan Jeevan POS
              </p>
            </div>

            <Alert variant="destructive" class="mb-3" v-if="!!generalError">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {{ generalError }}
              </AlertDescription>
            </Alert>
            <FieldSet>
              <FieldGroup>
                <Field :data-invalid="!!errors?.name">
                  <FieldLabel for="accountName"> Nama </FieldLabel>
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="Indra Pratama"
                    v-model="data.name"
                    aria-invalid
                  />
                  <FieldError v-if="!!errors?.name">{{
                    errors?.name
                  }}</FieldError>
                </Field>
                <Field :data-invalid="!!errors?.username">
                  <FieldLabel for="accountUsername"> Username </FieldLabel>
                  <FieldDescription
                    >Huruf kecil dan gak boleh ada spasi</FieldDescription
                  >
                  <Input
                    id="accountUsername"
                    type="text"
                    placeholder="e.g : indrap, indra_pratama, indra123"
                    v-model="data.username"
                    aria-invalid
                  />
                  <FieldError v-if="!!errors?.username">{{
                    errors?.username
                  }}</FieldError>
                </Field>
                <Field :data-invalid="!!errors?.email">
                  <FieldLabel for="accountEmail"> Email </FieldLabel>
                  <Input
                    id="accountEmail"
                    type="email"
                    placeholder="indrap@example.com"
                    v-model="data.email"
                    aria-invalid
                  />
                  <FieldError v-if="!!errors?.email">{{
                    errors?.email
                  }}</FieldError>
                </Field>
                <Field :data-invalid="!!errors?.phone">
                  <FieldLabel for="accountPhone"> No Handphone </FieldLabel>
                  <Input
                    id="accountPhone"
                    type="text"
                    placeholder="08134xxxxxx"
                    v-model="data.phone"
                    aria-invalid
                  />
                  <FieldError v-if="!!errors?.phone">{{
                    errors?.phone
                  }}</FieldError>
                </Field>
                <Field :data-invalid="!!errors?.password">
                  <Field class="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel for="password"> Password </FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        v-model="data.password"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors?.password">{{
                        errors?.password
                      }}</FieldError>
                    </Field>
                    <Field :data-invalid="!!errors?.password_confirmation">
                      <FieldLabel for="confirmPassword">
                        Ulangi Password
                      </FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        v-model="data.password_confirmation"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors?.password_confirmation">{{
                        errors?.password_confirmation
                      }}</FieldError>
                    </Field>
                  </Field>
                </Field>

                <Field>
                  <Button type="submit" :disabled="loading">
                    <Spinner v-if="loading" />
                    {{ loading ? "Mendafatar...." : "Daftar Sekarang" }}
                  </Button>
                  <FieldDescription class="text-center">
                    Sudah punya akun usaha?
                    <RouterLink :to="{ name: 'auth.login' }">Login</RouterLink>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
    <FieldDescription class="px-6 text-center">
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
