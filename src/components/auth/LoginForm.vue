<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useRoute } from "vue-router";
import { ref } from "vue";
import { authService } from "../../modules/auth/services/auth.service";
import type { LoginPayload } from "@/core/types/auth.types";
import { normalizeError } from "@/lib/errors";
import { useAuthStore } from "@/core/stores/auth.store";
import { Spinner } from "../ui/spinner";
import { router } from "@/core/router/route";
import { useLoadingStore } from "@/core/stores/loading.store";
import { onMounted } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const route = useRoute();
const loadingStore = useLoadingStore();
const authStore = useAuthStore();

const isRegistered = ref(route.query.isRegistered);
const loading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");

const user = ref<LoginPayload>({
  username: "",
  password: "",
});

async function handleLogin() {
  loadingStore.show('Masuk 🔑')
  loading.value = true;
  errors.value = {};
  generalError.value = "";
  isRegistered.value = "false";

  try {
    const res = await authService.login(user.value);
    const data = res.data
    loadingStore.show('Berhasil masuk 🎉')
    authStore.setFormPayload(data)
    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 1500);
  } catch (e) {
    loadingStore.hide()
    const err = normalizeError(e);
    if (err.status === 422) {
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
        <form class="p-6 md:p-8" @submit.prevent="handleLogin()">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">Login</h1>
              <p class="text-muted-foreground text-balance">
                Login to your Jeevan account
              </p>
            </div>
            <Alert class="" variant="info" v-if="isRegistered === 'true'">
              <AlertTitle>Akun berhasil dibuat</AlertTitle>
              <AlertDescription>
                Silahkan login dengan akun yang dibuat tadi.
              </AlertDescription>
            </Alert>
            <Alert class="" variant="destructive" v-if="!!generalError">
              <AlertTitle>Ooopss...</AlertTitle>
              <AlertDescription>
                {{ generalError }}
              </AlertDescription>
            </Alert>
            <Field :data-invalid="!!errors.username">
              <FieldLabel for="username"> Username </FieldLabel>
              <Input
                v-model="user.username"
                id="username"
                type="text"
                placeholder="alviani123"
                aria-invalid
              />
              <FieldError v-if="!!errors?.username">{{
                errors?.username
              }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.password">
              <div class="flex items-center">
                <FieldLabel for="password"> Password </FieldLabel>
                <a
                  href="#"
                  class="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  Lupa password?
                </a>
              </div>
              <Input
                v-model="user.password"
                id="password"
                type="password"
                autocomplete="off"
                aria-invalid
              />
              <FieldError v-if="!!errors?.password">{{
                errors?.password
              }}</FieldError>
            </Field>
            <Field>
              <Button type="submit" :disabled="loading">
                <Spinner v-if="loading" />
                Login
              </Button>
            </Field>
            <FieldDescription class="text-center">
              Belum punya akun?
              <RouterLink :to="{ name: 'auth.register' }"> Daftar </RouterLink>
            </FieldDescription>
          </FieldGroup>
        </form>
        <div class="bg-muted relative hidden md:block">
          <img
            src="#"
            alt="Image"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </CardContent>
    </Card>
    <FieldDescription class="px-6 text-center">
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </FieldDescription>
  </div>
</template>
