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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRoute } from "vue-router";
import { onBeforeMount, ref } from "vue";
import { normalizeError } from "@/lib/errors";
import { useAuthStore } from "@/core/stores/auth.store";
import { useMerchantStore } from "@/core/stores/merchant.store";
import type { MerchantRegister } from "@/core/types/merchant.types";
import type { IndustryPackage } from "@/core/types/auth.types";
import { authService } from "@/modules/auth/services/auth.service";
import { useLoadingStore } from "@/core/stores/loading.store";
import { router } from "@/core/router/route";
import { onMounted } from "vue";
import { SetupWizardService } from "@/modules/setup-wizard/services/setup-wizard.service";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const route = useRoute();
const authStore = useAuthStore();
const merchantStore = useMerchantStore();
const loadingStore = useLoadingStore();

const isRegistered = ref(route.query.isRegistered);
const loading = ref(false);
const loadingIndusrtyPackage = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");

const merchant = ref<MerchantRegister>({
  name: "",
  industry_package_code: "",
});

const industryPackages = ref<IndustryPackage[]>();

async function fetchIndustryPackages() {
  loadingIndusrtyPackage.value = true;
  try {
    const res = await authService.getIndustryPackages();
    industryPackages.value = res.data;
  } finally {
    loadingIndusrtyPackage.value = false;
  }
}

async function handleRegis() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";
  isRegistered.value = "false";
  loadingStore.show("Sedang diproses ⏳");

  try {
    const res = await SetupWizardService.setup(merchant.value);
    loadingStore.show("Nice ✨, Setup berhasil");
    const data = res.data;
    authStore.setFormPayload(data)
    merchantStore.isWelcome = true;
    router.push({ name: "dashboard" });
  } catch (e) {
    loadingStore.hide();
    const err = normalizeError(e);
    console.log(err);
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

onBeforeMount(async () => {
  await fetchIndustryPackages();
});
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="p-6 md:p-8" @submit.prevent="handleRegis()">
          <FieldGroup>
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">Setup Wizard</h1>
              <p class="text-muted-foreground text-balance">
                Yuk lengkapi buat Bangun identitas bisnismu
              </p>
            </div>
            <Alert class="" variant="info" v-if="isRegistered === 'true'">
              <AlertTitle>Akun berhasil dibuat</AlertTitle>
              <AlertDescription>
                Yuk lengkapi untuk identitas bisnismu.
              </AlertDescription>
            </Alert>
            <Alert class="" variant="destructive" v-if="!!generalError">
              <AlertTitle>Ooopss...</AlertTitle>
              <AlertDescription>
                {{ generalError }}
              </AlertDescription>
            </Alert>
            <Field :data-invalid="!!errors.name">
              <FieldLabel for="name"> Nama Bisnis </FieldLabel>
              <Input
                v-model="merchant.name"
                id="name"
                type="text"
                placeholder="Kopi Nusantara"
                aria-invalid
              />
              <FieldError v-if="!!errors?.name">{{ errors?.name }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors?.industry_package_code">
              <FieldLabel for="businessType"> Jenis Bisnis </FieldLabel>
              <Select
                id="businessType"
                v-model="merchant.industry_package_code"
                aria-invalid
              >
                <SelectTrigger>
                  <SelectValue
                    :placeholder="
                      loadingIndusrtyPackage
                        ? 'Sedang memuat...'
                        : '-- Pilih jenis bisnis --'
                    "
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="pkg in industryPackages"
                    :value="pkg.code"
                    :key="pkg.code"
                  >
                    {{ pkg.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError v-if="!!errors?.industry_package_code">{{
                errors?.industry_package_code
              }}</FieldError>
            </Field>
            <Field>
              <Button type="submit" :disabled="loading">
                {{ loading ? "Memproses..." : "Lanjutkan" }}
              </Button>
            </Field>
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
