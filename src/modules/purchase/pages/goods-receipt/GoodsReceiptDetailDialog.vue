<script setup lang="ts">
import { computed } from "vue";
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  File01Icon,
  PackageCheck,
  WarehouseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCan } from "@/core/composables/useCan";
import type { GoodsReceipt } from "../../types/goods-receipt.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{ receipt?: GoodsReceipt }>();
const emit = defineEmits<{
  post: [receipt: GoodsReceipt];
  void: [receipt: GoodsReceipt];
}>();
const { can } = useCan();
const currencyFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const quantityFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const statusLabels: Record<string, string> = {
  draft: "Draft",
  posted: "Diposting",
  voided: "Dibatalkan",
};
const statusLabel = computed(
  () => statusLabels[props.receipt?.status ?? "draft"],
);
const statusIcon = computed(() => {
  switch (props.receipt?.status) {
    case "posted":
      return CheckmarkCircleIcon;
    case "voided":
      return CancelCircleIcon;
    default:
      return Alert02Icon;
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[94dvh] max-h-[97dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-6xl"
    >
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <HugeiconsIcon :icon="PackageCheck" aria-hidden="true" />
          </div>
          <div class="min-w-0 space-y-1">
            <DialogTitle class="truncate"
              >Penerimaan {{ receipt?.document_number }}</DialogTitle
            >
            <DialogDescription
              >Rincian penerimaan dan nilai yang dihitung
              server.</DialogDescription
            >
          </div>
        </div>
      </DialogHeader>
      <div
        v-if="receipt"
        class="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6"
      >
        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Informasi Penerimaan Barang</h3>
            <p class="text-xs text-muted-foreground">
              Ringkasan status, supplier, gudang, dan referensi penerimaan.
            </p>
          </header>
          <div
            class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="statusIcon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Status</p>
                <Badge class="mt-1">{{ statusLabel }}</Badge>
              </div>
            </div>
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="Calendar02Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Tanggal</p>
                <p class="truncate text-sm font-medium">
                  {{ dateFormat.format(new Date(receipt.receipt_date)) }}
                </p>
              </div>
            </div>
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="DeliveryTruck01Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Supplier</p>
                <p
                  class="truncate text-sm font-medium"
                  :title="receipt.supplier_name ?? ''"
                >
                  {{ receipt.supplier_name || "—" }}
                </p>
              </div>
            </div>
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="WarehouseIcon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Gudang</p>
                <p
                  class="truncate text-sm font-medium"
                  :title="receipt.warehouse_name ?? ''"
                >
                  {{ receipt.warehouse_name || "—" }}
                </p>
              </div>
            </div>
            <div
              v-if="receipt.purchase_order"
              class="flex min-w-0 items-center gap-3"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">
                  Referensi Purchase Order
                </p>
                <p
                  class="truncate text-sm font-medium"
                  :title="receipt.purchase_order.document_number"
                >
                  {{ receipt.purchase_order.document_number }}
                </p>
              </div>
            </div>
            <div
              v-if="receipt.delivery_note_number"
              class="flex min-w-0 items-center gap-3"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Surat jalan</p>
                <p
                  class="truncate text-sm font-medium"
                  :title="receipt.delivery_note_number"
                >
                  {{ receipt.delivery_note_number }}
                </p>
              </div>
            </div>
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="CreditCardIcon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">
                  Harga termasuk pajak
                </p>
                <p class="text-sm font-medium">
                  {{ receipt.is_tax_inclusive ? "Ya" : "Tidak" }}
                </p>
              </div>
            </div>
            <div
              v-if="receipt.notes"
              class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Catatan</p>
                <p class="whitespace-pre-wrap break-words text-sm">
                  {{ receipt.notes }}
                </p>
              </div>
            </div>
            <div
              v-if="receipt.void_reason"
              class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3"
            >
              <HugeiconsIcon
                :icon="CancelCircleIcon"
                class="mt-0.5 size-6 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Alasan pembatalan</p>
                <p class="whitespace-pre-wrap break-words text-sm">
                  {{ receipt.void_reason }}
                </p>
              </div>
            </div>
          </div>
        </section>
        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Item Penerimaan</h3>
            <p class="text-xs text-muted-foreground">
              Rincian produk, satuan, jumlah, harga, dan pajak.
            </p>
          </header>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th class="p-3">Produk</th>
                  <th class="p-3">Satuan</th>
                  <th class="p-3">Jumlah</th>
                  <th class="p-3">Harga</th>
                  <th class="p-3">Diskon</th>
                  <th class="p-3">Pajak</th>
                  <th class="p-3">Total baris</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="item in receipt.items" :key="item.id">
                  <td class="p-3">
                    <div class="font-medium">{{ item.product_name }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ item.variant_name || "Varian" }} · {{ item.sku }}
                    </div>
                  </td>
                  <td class="p-3">
                    {{ item.unit_name }} ({{ item.unit_code }})
                  </td>
                  <td class="p-3">
                    {{ quantityFormat.format(Number(item.unit_quantity)) }}
                    <span class="text-xs text-muted-foreground"
                      >→
                      {{
                        quantityFormat.format(Number(item.base_quantity))
                      }}
                      dasar</span
                    >
                  </td>
                  <td class="p-3">
                    {{ currencyFormat.format(Number(item.unit_price)) }}
                  </td>
                  <td class="p-3">
                    {{ currencyFormat.format(Number(item.discount_amount)) }}
                  </td>
                  <td class="p-3">
                    {{ Number(item.tax_rate) }}% ·
                    {{ currencyFormat.format(Number(item.tax_amount)) }}
                  </td>
                  <td class="p-3 font-medium">
                    {{ currencyFormat.format(Number(item.line_total)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section
          class="ml-auto w-full max-w-md overflow-hidden rounded-xl border"
        >
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Ringkasan Nilai</h3>
          </header>
          <div class="grid gap-2 p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Subtotal</span
              ><span>{{
                currencyFormat.format(Number(receipt.items_subtotal))
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Diskon dokumen</span
              ><span
                >-{{
                  currencyFormat.format(Number(receipt.discount_amount))
                }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Pajak</span
              ><span>{{
                currencyFormat.format(Number(receipt.tax_amount))
              }}</span>
            </div>
            <div class="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span
              ><span>{{
                currencyFormat.format(Number(receipt.grand_total))
              }}</span>
            </div>
          </div>
        </section>
      </div>
      <DialogFooter class="mx-0 mb-0 shrink-0 border-t px-4 py-4 sm:px-6">
        <Button
          v-if="receipt?.status === 'draft' && can('purchase.receipt.post')"
          @click="emit('post', receipt)"
          >Posting</Button
        >
        <Button
          v-if="receipt?.status === 'posted' && can('purchase.receipt.void')"
          variant="destructive"
          @click="emit('void', receipt)"
          >Batalkan (void)</Button
        >
        <Button variant="outline" @click="open = false">Tutup</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
