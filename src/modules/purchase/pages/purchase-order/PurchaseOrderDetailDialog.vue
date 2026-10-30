<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Alert02Icon,
  Calendar02Icon,
  CancelCircleIcon,
  CheckmarkCircleIcon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  File01Icon,
  PackageCheck,
  ShoppingBag01Icon,
  UnavailableIcon,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PurchaseOrder } from "../../types/purchase-order.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{ order?: PurchaseOrder }>();
const emit = defineEmits<{
  approve: [order: PurchaseOrder];
  cancel: [order: PurchaseOrder];
  closeOrder: [order: PurchaseOrder];
  receive: [order: PurchaseOrder];
}>();

const { can } = useCan();
const activeTab = ref("items");
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
  approved: "Disetujui",
  partially_received: "Diterima Sebagian",
  received: "Selesai Diterima",
  closed: "Ditutup",
  cancelled: "Dibatalkan",
};

const statusVariants: Record<
  string,
  "secondary" | "default" | "destructive" | "outline"
> = {
  draft: "secondary",
  approved: "default",
  partially_received: "outline",
  received: "default",
  closed: "secondary",
  cancelled: "destructive",
};

const statusLabel = computed(() =>
  props.order ? (statusLabels[props.order.status] ?? props.order.status) : "",
);
const statusIcon = computed(() => {
  switch (props.order?.status) {
    case "approved":
    case "received":
      return CheckmarkCircleIcon;
    case "cancelled":
      return CancelCircleIcon;
    case "closed":
      return UnavailableIcon;
    default:
      return Alert02Icon;
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[94dvh] max-h-[97dvh] w-[calc(100vw-0.5rem)] max-w-[calc(100vw-0.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-6xl"
    >
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <HugeiconsIcon :icon="ShoppingBag01Icon" aria-hidden="true" />
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <DialogTitle class="truncate"
              >Purchase Order {{ order?.document_number }}</DialogTitle
            >
            <DialogDescription
              >Rincian pemesanan barang ke supplier.</DialogDescription
            >
          </div>
        </div>
      </DialogHeader>

      <template v-if="order">
        <div
          class="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
        >
        <!-- Informasi Purchase Order -->
        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Informasi Purchase Order</h3>
            <p class="text-xs text-muted-foreground">Ringkasan status, supplier, gudang, dan jadwal order.</p>
          </header>
          <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="statusIcon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Status</p>
                <Badge
                  :variant="statusVariants[order.status] ?? 'secondary'"
                  class="mt-1"
                  >{{ statusLabel }}</Badge
                >
              </div>
            </div>

            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="Calendar02Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Tanggal Order</p>
                <p class="truncate text-sm font-medium">
                  {{ dateFormat.format(new Date(order.order_date)) }}
                </p>
              </div>
            </div>

            <div class="flex min-w-0 items-center gap-3">
              <HugeiconsIcon
                :icon="Calendar02Icon"
                class="size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Estimasi Kedatangan</p>
                <p class="truncate text-sm font-medium">
                  {{
                    order.expected_date
                      ? dateFormat.format(new Date(order.expected_date))
                      : "—"
                  }}
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
                  :title="order.supplier_name ?? ''"
                >
                  {{ order.supplier_name || "—" }}
                  <span
                    v-if="order.payment_term_days"
                    class="text-xs text-muted-foreground"
                  >
                    (Tempo {{ order.payment_term_days }} hari)
                  </span>
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
                <p class="text-xs text-muted-foreground">Gudang Tujuan</p>
                <p
                  class="truncate text-sm font-medium"
                  :title="order.warehouse_name ?? ''"
                >
                  {{ order.warehouse_name || "—" }}
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
                  Harga Termasuk Pajak
                </p>
                <p class="text-sm font-medium">
                  {{ order.is_tax_inclusive ? "Ya" : "Tidak" }}
                </p>
              </div>
            </div>

            <div
              v-if="order.cancel_reason"
              class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3"
            >
              <HugeiconsIcon
                :icon="CancelCircleIcon"
                class="mt-0.5 size-6 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Alasan Pembatalan</p>
                <p class="text-sm text-destructive font-medium">
                  {{ order.cancel_reason }}
                </p>
              </div>
            </div>

            <div
              v-if="order.notes"
              class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">Catatan</p>
                <p class="whitespace-pre-wrap text-sm text-foreground">
                  {{ order.notes }}
                </p>
              </div>
            </div>

            <div
              v-if="order.purchase_requests?.length"
              class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-3"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="mt-0.5 size-6 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">
                  Sumber Purchase Request
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge
                    v-for="request in order.purchase_requests"
                    :key="request.id"
                    variant="outline"
                  >
                    {{ request.document_number }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Tabs v-model="activeTab" class="min-w-0">
          <TabsList class="w-full justify-start sm:w-fit">
            <TabsTrigger value="items">Item Produk</TabsTrigger>
            <TabsTrigger value="receipts">Riwayat Penerimaan</TabsTrigger>
          </TabsList>

          <!-- Tabel Item -->
          <TabsContent value="items" class="mt-2 min-w-0">
          <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Daftar Barang Pesanan</h3>
            <p class="text-xs text-muted-foreground">Rincian produk, jumlah, harga, dan penerimaan barang.</p>
          </header>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th class="p-3">Produk / Varian</th>
                  <th class="p-3 text-right">Dipesan</th>
                  <th class="p-3 text-right">Diterima</th>
                  <th class="p-3 text-right">Sisa</th>
                  <th class="p-3 text-right">Harga Satuan</th>
                  <th class="p-3 text-right">Diskon</th>
                  <th class="p-3 text-right">Pajak</th>
                  <th class="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="item in order.items"
                  :key="item.id"
                  class="hover:bg-muted/20"
                >
                  <td class="p-3">
                    <p class="font-medium text-foreground">
                      {{ item.product_name }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{
                        item.variant_name ? `${item.variant_name} · ` : ""
                      }}SKU: {{ item.sku }}
                    </p>
                    <p
                      v-if="item.notes"
                      class="mt-0.5 text-xs italic text-muted-foreground"
                    >
                      {{ item.notes }}
                    </p>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    {{ quantityFormat.format(Number(item.unit_quantity)) }}
                    {{ item.unit_code }}
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    <span
                      :class="
                        Number(item.received_base_quantity) > 0
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      "
                    >
                      {{
                        quantityFormat.format(
                          Number(item.received_base_quantity),
                        )
                      }}
                      (dasar)
                    </span>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    <span
                      :class="
                        Number(item.remaining_base_quantity) > 0
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-muted-foreground'
                      "
                    >
                      {{
                        quantityFormat.format(
                          Number(item.remaining_unit_quantity),
                        )
                      }}
                      {{ item.unit_code }}
                    </span>
                  </td>
                  <td class="p-3 text-right whitespace-nowrap">
                    {{ currencyFormat.format(Number(item.unit_price)) }}
                  </td>
                  <td
                    class="p-3 text-right whitespace-nowrap text-muted-foreground"
                  >
                    {{
                      Number(item.discount_amount) > 0
                        ? currencyFormat.format(Number(item.discount_amount))
                        : "—"
                    }}
                  </td>
                  <td
                    class="p-3 text-right whitespace-nowrap text-muted-foreground"
                  >
                    {{ Number(item.tax_rate) > 0 ? `${item.tax_rate}%` : "—" }}
                  </td>
                  <td class="p-3 text-right whitespace-nowrap font-medium">
                    {{ currencyFormat.format(Number(item.line_total)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </section>

        <!-- Ringkasan Biaya -->
        <div class="mt-4 flex justify-end">
          <div
            class="flex flex-col gap-1.5 w-full max-w-xs rounded-lg border bg-muted/20 p-3 text-sm"
          >
            <div class="flex justify-between text-muted-foreground">
              <span>Subtotal Item:</span>
              <span>{{
                currencyFormat.format(Number(order.items_subtotal))
              }}</span>
            </div>
            <div
              v-if="Number(order.discount_amount) > 0"
              class="flex justify-between text-muted-foreground"
            >
              <span>Diskon Header:</span>
              <span class="text-destructive"
                >-{{
                  currencyFormat.format(Number(order.discount_amount))
                }}</span
              >
            </div>
            <div class="flex justify-between text-muted-foreground">
              <span>Pajak (PPN):</span>
              <span>{{ currencyFormat.format(Number(order.tax_amount)) }}</span>
            </div>
            <div
              class="flex justify-between border-t pt-1.5 font-semibold text-foreground"
            >
              <span>Grand Total:</span>
              <span class="text-base text-primary">{{
                currencyFormat.format(Number(order.grand_total))
              }}</span>
            </div>
          </div>
        </div>
        </TabsContent>

        <!-- Riwayat Penerimaan Barang Terkait -->
        <TabsContent value="receipts" class="mt-2 min-w-0">
        <div
          v-if="order.goods_receipts && order.goods_receipts.length > 0"
          class="flex flex-col gap-2 rounded-xl border p-4"
        >
          <h4 class="text-sm font-semibold flex items-center gap-1.5">
            <HugeiconsIcon
              :icon="PackageCheck"
              class="size-4 text-primary"
              aria-hidden="true"
            />
            Riwayat Penerimaan Barang ({{ order.goods_receipts.length }})
          </h4>
          <div class="divide-y rounded-lg border text-sm">
            <div
              v-for="gr in order.goods_receipts"
              :key="gr.id"
              class="flex items-center justify-between p-3 hover:bg-muted/10"
            >
              <div>
                <span class="font-medium text-foreground">{{
                  gr.document_number
                }}</span>
                <span class="ml-2 text-xs text-muted-foreground">
                  Tanggal: {{ dateFormat.format(new Date(gr.receipt_date)) }}
                </span>
              </div>
              <Badge variant="outline">{{ gr.status }}</Badge>
            </div>
          </div>
        </div>
        <div v-else class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada riwayat penerimaan barang.
        </div>
        </TabsContent>
        </Tabs>
        </div>
      </template>

      <DialogFooter
        class="mx-0 mb-0 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-4 sm:px-6"
      >
        <Button variant="outline" @click="open = false">Tutup</Button>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Draft: Approve button -->
          <Button
            v-if="order?.status === 'draft' && can('purchase.order.approve')"
            @click="emit('approve', order!)"
          >
            <HugeiconsIcon
              :icon="CheckmarkCircleIcon"
              data-icon="inline-start"
              aria-hidden="true"
            />
            Setujui (Approve)
          </Button>

          <!-- Approved / Partially Received: Terima Barang shortcut -->
          <Button
            v-if="
              (order?.status === 'approved' ||
                order?.status === 'partially_received') &&
              can('purchase.receipt.create')
            "
            @click="emit('receive', order!)"
          >
            <HugeiconsIcon
              :icon="PackageCheck"
              data-icon="inline-start"
              aria-hidden="true"
            />
            Terima Barang
          </Button>

          <!-- Approved / Partially Received: Tutup PO -->
          <Button
            v-if="
              (order?.status === 'approved' ||
                order?.status === 'partially_received') &&
              can('purchase.order.close')
            "
            variant="outline"
            @click="emit('closeOrder', order!)"
          >
            <HugeiconsIcon
              :icon="UnavailableIcon"
              data-icon="inline-start"
              aria-hidden="true"
            />
            Tutup PO
          </Button>

          <!-- Draft or Approved without receipt: Batalkan -->
          <Button
            v-if="
              (order?.status === 'draft' || order?.status === 'approved') &&
              can('purchase.order.cancel')
            "
            variant="destructive"
            @click="emit('cancel', order!)"
          >
            <HugeiconsIcon
              :icon="CancelCircleIcon"
              data-icon="inline-start"
              aria-hidden="true"
            />
            Batalkan PO
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
