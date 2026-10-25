<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  BankIcon,
  Building03Icon,
  Calendar02Icon,
  Call02Icon,
  Contact01Icon,
  CreditCardIcon,
  File01Icon,
  HashtagIcon,
  Location01Icon,
  Mail01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeError } from "@/lib/errors";
import { supplierService } from "../../services/supplier.service";
import type { Supplier, SupplierListItem } from "@/core/types/supplier.types";

const props = defineProps<{
  selectedSupplier?: SupplierListItem;
}>();

const open = defineModel<boolean>("open", { default: false });
const supplier = ref<Supplier | null>(null);
const loading = ref(false);
const errorMessage = ref("");
let requestSequence = 0;

const initials = computed(() => {
  const words = supplier.value?.name.trim().split(/\s+/).filter(Boolean) ?? [];

  return (
    words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "S"
  );
});

const supplierAddress = computed(() => {
  if (!supplier.value) return "";

  return [
    supplier.value.address,
    supplier.value.region?.nama,
    supplier.value.postal_code,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(", ");
});

function displayValue(value?: string | number | null): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Belum diisi";
  }

  return String(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "Belum tersedia";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function fetchSupplier(): Promise<void> {
  const supplierId = props.selectedSupplier?.id;
  const currentRequest = ++requestSequence;

  supplier.value = null;
  errorMessage.value = "";

  if (!supplierId) {
    errorMessage.value = "Data supplier tidak ditemukan.";
    return;
  }

  loading.value = true;

  try {
    const response = await supplierService.edit(supplierId);

    if (currentRequest === requestSequence && open.value) {
      supplier.value = response.data;
    }
  } catch (error) {
    if (currentRequest === requestSequence && open.value) {
      errorMessage.value = normalizeError(error).message;
    }
  } finally {
    if (currentRequest === requestSequence) {
      loading.value = false;
    }
  }
}

watch([open, () => props.selectedSupplier?.id], ([isOpen]) => {
  if (isOpen) {
    void fetchSupplier();
    return;
  }

  requestSequence += 1;
  loading.value = false;
  supplier.value = null;
  errorMessage.value = "";
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[90dvh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader
        class="shrink-0 px-5 pb-5 pt-6 pr-12 sm:px-7 sm:pb-6 sm:pt-7 sm:pr-14 lg:px-6 lg:pb-4 lg:pt-5"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14"
          >
            <HugeiconsIcon
              :icon="Building03Icon"
              :size="28"
              class="text-primary"
              aria-hidden="true"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <Badge v-if="supplier" variant="outline" class="gap-1">
                <HugeiconsIcon :icon="HashtagIcon" aria-hidden="true" />
                {{ supplier.code || "Tanpa kode" }}
              </Badge>
              <Badge
                v-if="supplier"
                :variant="supplier.is_active ? 'success' : 'secondary'"
              >
                {{ supplier.is_active ? "Aktif" : "Nonaktif" }}
              </Badge>
            </div>

            <DialogTitle
              class="break-words text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {{ supplier?.name || "Detail supplier" }}
            </DialogTitle>
            <DialogDescription class="mt-1">
              Informasi kontak, lokasi, dan ketentuan kerja sama supplier.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <Separator />

      <div
        class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 lg:px-6 lg:py-4"
      >
        <div
          v-if="loading"
          class="grid gap-4 md:grid-cols-2 lg:gap-3"
          aria-label="Memuat detail supplier"
        >
          <Card v-for="section in 4" :key="section">
            <CardHeader class="gap-2 lg:p-3">
              <Skeleton class="h-5 w-36" />
              <Skeleton class="h-4 w-52" />
            </CardHeader>
            <CardContent class="flex flex-col gap-5 lg:gap-2 lg:px-3 lg:pb-3">
              <div v-for="row in 3" :key="row" class="flex flex-col gap-2">
                <Skeleton class="h-3 w-24" />
                <Skeleton class="h-4 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert v-else-if="errorMessage" variant="destructive">
          <AlertTitle>Detail supplier belum dapat dimuat</AlertTitle>
          <AlertDescription
            class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{{ errorMessage }}</span>
            <Button variant="outline" size="sm" @click="fetchSupplier"
              >Coba lagi</Button
            >
          </AlertDescription>
        </Alert>

        <div
          v-else-if="supplier"
          class="grid gap-4 md:grid-cols-2 lg:gap-3"
        >
          <Card>
            <CardHeader class="flex items-center gap-3 lg:p-3">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <HugeiconsIcon
                  :icon="Contact01Icon"
                  :size="20"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0">
                <CardTitle>Informasi kontak</CardTitle>
                <CardDescription>Cara menghubungi supplier</CardDescription>
              </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4 lg:gap-2 lg:px-3 lg:pb-3">
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="UserIcon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Contact person</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.contact_person) }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="Call02Icon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Nomor telepon</p>
                  <a
                    v-if="supplier.phone"
                    :href="`tel:${supplier.phone}`"
                    class="mt-1 block break-words text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >{{ supplier.phone }}</a
                  >
                  <p v-else class="mt-1 text-sm font-medium">Belum diisi</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="Mail01Icon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Email</p>
                  <a
                    v-if="supplier.email"
                    :href="`mailto:${supplier.email}`"
                    class="mt-1 block break-words text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >{{ supplier.email }}</a
                  >
                  <p v-else class="mt-1 text-sm font-medium">Belum diisi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex items-center gap-3 lg:p-3">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <HugeiconsIcon
                  :icon="Location01Icon"
                  :size="20"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0">
                <CardTitle>Lokasi & identitas</CardTitle>
                <CardDescription
                  >Alamat dan informasi terdaftar</CardDescription
                >
              </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4 lg:gap-2 lg:px-3 lg:pb-3">
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="Location01Icon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Alamat</p>
                  <p class="mt-1 break-words text-sm font-medium leading-6">
                    {{ displayValue(supplierAddress) }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="File01Icon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">NPWP / Tax ID</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.tax_id) }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="HashtagIcon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Kode supplier</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.code) }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex items-center gap-3 lg:p-3">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <HugeiconsIcon
                  :icon="CreditCardIcon"
                  :size="20"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0">
                <CardTitle>Pembayaran & rekening</CardTitle>
                <CardDescription>Ketentuan pembayaran supplier</CardDescription>
              </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4 lg:gap-2 lg:px-3 lg:pb-3">
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="Calendar02Icon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">
                    Jatuh tempo pembayaran
                  </p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{
                      supplier.payment_term_days != null
                        ? `${supplier.payment_term_days} hari`
                        : "Belum diisi"
                    }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="BankIcon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Nama bank</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.bank_name) }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="UserIcon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Pemilik rekening</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.bank_account_name) }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <HugeiconsIcon
                  :icon="CreditCardIcon"
                  :size="16"
                  class="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">Nomor rekening</p>
                  <p class="mt-1 break-words text-sm font-medium">
                    {{ displayValue(supplier.bank_account_number) }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="flex items-center gap-3 lg:p-3">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              >
                <HugeiconsIcon
                  :icon="File01Icon"
                  :size="20"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0">
                <CardTitle>Catatan & aktivitas</CardTitle>
                <CardDescription>Informasi tambahan supplier</CardDescription>
              </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4 lg:gap-2 lg:px-3 lg:pb-3">
              <div>
                <p class="text-xs text-muted-foreground">Catatan</p>
                <p
                  class="mt-1 whitespace-pre-wrap break-words text-sm leading-6"
                >
                  {{ displayValue(supplier.notes) }}
                </p>
              </div>
              <Separator />
              <div class="grid gap-4 sm:grid-cols-2 lg:gap-2">
                <div class="flex items-start gap-3">
                  <HugeiconsIcon
                    :icon="Calendar02Icon"
                    :size="16"
                    class="mt-0.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div class="min-w-0">
                    <p class="text-xs text-muted-foreground">Tanggal dibuat</p>
                    <p class="mt-1 break-words text-sm font-medium">
                      {{ formatDate(supplier.created_at) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <HugeiconsIcon
                    :icon="Calendar02Icon"
                    :size="16"
                    class="mt-0.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div class="min-w-0">
                    <p class="text-xs text-muted-foreground">
                      Terakhir diperbarui
                    </p>
                    <p class="mt-1 break-words text-sm font-medium">
                      {{ formatDate(supplier.updated_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" :disabled="loading"> Tutup </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
