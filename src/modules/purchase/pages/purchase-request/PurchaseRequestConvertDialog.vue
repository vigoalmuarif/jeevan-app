<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Add01Icon,
  Alert02Icon,
  CheckmarkCircleIcon,
  DeliveryTruck01Icon,
  PackageCheck,
  ShoppingBag01Icon,
  WarehouseIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import ComboboxSelect from '@/components/ui/combobox/ComboboxSelect.vue'
import ServerComboBox from '@/components/server-combobox/ServerComboBox.vue'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogScrollContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import MoneyInput from '@/components/ui/input-group/MoneyInput.vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { normalizeError } from '@/lib/errors'
import { toast } from 'vue-sonner'
import { purchaseRequestService } from '../../services/purchase-request.service'
import type {
  ApprovedPurchaseRequestItem,
  ConvertOrderGroupPayload,
  ConvertPurchaseRequestPayload,
  PurchaseRequestOptions,
} from '../../types/purchase-request.types'
import type { ApprovedItemsFilter } from '../../services/purchase-request.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  options: PurchaseRequestOptions
  initialPrId?: number
}>()
const emit = defineEmits<{ converted: [] }>()

const loading = ref(false)
const itemsLoading = ref(false)
const approvedItems = ref<ApprovedPurchaseRequestItem[]>([])
const itemCatalog = reactive<Record<number, ApprovedPurchaseRequestItem>>({})
const selectedItemIds = ref<number[]>([])
const filters = reactive<ApprovedItemsFilter>({
  purchase_request_id: null,
  warehouse_id: null,
  branch_id: null,
  product_variant_id: null,
})

type ItemFormState = {
  selected: boolean
  unit_quantity: number | string
  supplier_id: number | null
  unit_price: number | string
}

const itemStates = reactive<Record<number, ItemFormState>>({})
const generalError = ref('')

const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const quantityFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const supplierOptions = computed(() => props.options.suppliers.map(supplier => ({
  value: String(supplier.id),
  label: supplier.code ? `${supplier.name} (${supplier.code})` : supplier.name,
})))

async function loadApprovedItems() {
  itemsLoading.value = true
  generalError.value = ''
  try {
    approvedItems.value = await purchaseRequestService.getApprovedItems(filters)
    for (const item of approvedItems.value) {
      itemCatalog[item.purchase_request_item_id] = item
      if (!itemStates[item.purchase_request_item_id]) {
        // unit_quantity is remaining_base_quantity / conversion_rate
        const conv = Number(item.conversion_rate) || 1
        const maxUnitQty = Number(item.remaining_base_quantity) / conv
        itemStates[item.purchase_request_item_id] = {
          selected: props.initialPrId ? item.purchase_request_id === props.initialPrId : false,
          unit_quantity: maxUnitQty,
          supplier_id: item.suggested_supplier_id ?? (props.options.suppliers[0]?.id ?? null),
          unit_price: Number(item.estimated_unit_price) || 0,
        }
      }
    }
  } catch (error) {
    generalError.value = normalizeError(error).message
  } finally {
    itemsLoading.value = false
  }
}

const filterFetchers: Record<string, ComboboxFetcher> = {
  purchase_request_id: (search, params, requestOptions) => purchaseRequestService.searchApprovedItemFilterOptions(
    search, { ...params, type: 'purchase_request' }, requestOptions,
  ),
  warehouse_id: (search, params, requestOptions) => purchaseRequestService.searchApprovedItemFilterOptions(
    search, { ...params, type: 'warehouse' }, requestOptions,
  ),
  branch_id: (search, params, requestOptions) => purchaseRequestService.searchApprovedItemFilterOptions(
    search, { ...params, type: 'branch' }, requestOptions,
  ),
  product_variant_id: (search, params, requestOptions) => purchaseRequestService.searchApprovedItemFilterOptions(
    search, { ...params, type: 'item' }, requestOptions,
  ),
}

function clearFilters() {
  filters.purchase_request_id = null
  filters.warehouse_id = null
  filters.branch_id = null
  filters.product_variant_id = null
}

function resetItemStates() {
  for (const itemId of Object.keys(itemStates)) {
    delete itemStates[Number(itemId)]
  }
  for (const itemId of Object.keys(itemCatalog)) {
    delete itemCatalog[Number(itemId)]
  }
}

watch(open, isOpen => {
  if (isOpen) {
    resetItemStates()
    clearFilters()
    void loadApprovedItems()
  } else {
    generalError.value = ''
  }
})

watch(filters, () => {
  if (open.value) void loadApprovedItems()
})

// Grup berdasarkan (supplier_id, warehouse_id)
const previewGroups = computed(() => {
  const groups: Record<string, {
    supplier_id: number
    supplier_name: string
    warehouse_id: number
    warehouse_name: string
    branch_id: number | null
    items: Array<{
      item: ApprovedPurchaseRequestItem
      state: ItemFormState
    }>
  }> = {}

  for (const item of Object.values(itemCatalog)) {
    const state = itemStates[item.purchase_request_item_id]
    if (!state || !state.selected || !state.supplier_id) continue

    const key = `${state.supplier_id}_${item.warehouse_id}`
    if (!groups[key]) {
      const supplier = props.options.suppliers.find(s => s.id === state.supplier_id)
      groups[key] = {
        supplier_id: state.supplier_id,
        supplier_name: supplier?.name ?? `Supplier #${state.supplier_id}`,
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouse_name ?? `Gudang #${item.warehouse_id}`,
        branch_id: item.branch_id,
        items: [],
      }
    }
    groups[key].items.push({ item, state })
  }

  return Object.values(groups)
})

const displayedItems = computed(() => {
  const visibleIds = new Set(approvedItems.value.map(item => item.purchase_request_item_id))
  const retainedSelectedItems = Object.values(itemCatalog).filter(item => (
    !visibleIds.has(item.purchase_request_item_id)
    && itemStates[item.purchase_request_item_id]?.selected === true
  ))

  return [...approvedItems.value, ...retainedSelectedItems]
})

const selectedCount = computed(() => {
  return Object.values(itemStates).filter(state => state.selected).length
})

function toggleSelectAll(checked: boolean) {
  for (const item of approvedItems.value) {
    if (itemStates[item.purchase_request_item_id]) {
      itemStates[item.purchase_request_item_id].selected = checked
    }
  }
}

function setItemSelected(itemId: number, checked: boolean | 'indeterminate') {
  const state = itemStates[itemId]
  if (state) state.selected = checked === true
}

async function handleConvert() {
  if (previewGroups.value.length === 0) {
    toast.error('Pilih minimal satu item dan tentukan supplier untuk setiap item.')
    return
  }

  // Validasi supplier dan unit quantity
  for (const group of previewGroups.value) {
    for (const entry of group.items) {
      if (!entry.state.supplier_id) {
        toast.error(`Pilih supplier untuk item ${entry.item.product_name}`)
        return
      }
      if (Number(entry.state.unit_quantity) <= 0) {
        toast.error(`Kuantitas untuk item ${entry.item.product_name} harus lebih besar dari 0`)
        return
      }
    }
  }

  loading.value = true
  generalError.value = ''

  const orderDate = new Date().toISOString().slice(0, 10)
  const payload: ConvertPurchaseRequestPayload = {
    groups: previewGroups.value.map((group): ConvertOrderGroupPayload => ({
      supplier_id: group.supplier_id,
      warehouse_id: group.warehouse_id,
      branch_id: group.branch_id,
      order_date: orderDate,
      is_tax_inclusive: false,
      items: group.items.map(entry => ({
        purchase_request_item_id: entry.item.purchase_request_item_id,
        unit_id: entry.item.unit_id,
        unit_quantity: Number(entry.state.unit_quantity),
        unit_price: Number(entry.state.unit_price),
      })),
    })),
  }

  try {
    const res = await purchaseRequestService.convertToOrders(payload)
    toast.success(res.message || 'Purchase Order berhasil dibuat!')
    emit('converted')
    open.value = false
  } catch (error) {
    generalError.value = normalizeError(error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-xl sm:max-w-6xl">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon :icon="PackageCheck" aria-hidden="true" />
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <DialogTitle>Konversi Purchase Request ke Purchase Order</DialogTitle>
            <DialogDescription>
              Pilih item permintaan yang telah disetujui, tentukan supplier dan harga beli, lalu buat draft PO secara otomatis per supplier.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="min-w-0 overscroll-contain pr-1">
        <div class="flex flex-col gap-5">
        <Alert v-if="generalError" variant="destructive">
          <AlertTitle>Terjadi kesalahan</AlertTitle>
          <AlertDescription>{{ generalError }}</AlertDescription>
        </Alert>

        <!-- Filter tetap mounted saat request berjalan agar label pilihan tidak berubah menjadi ID. -->
        <div class="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <ServerComboBox v-model="filters.purchase_request_id" :fetcher="filterFetchers.purchase_request_id" value-key="id" label-key="label" placeholder="Semua No. PR" search-placeholder="Cari No. PR..." empty-text="No. PR tidak ditemukan." @update:model-value="value => filters.purchase_request_id = value ? Number(value) : null" />
          <ServerComboBox v-model="filters.warehouse_id" :fetcher="filterFetchers.warehouse_id" value-key="id" label-key="label" placeholder="Semua gudang" search-placeholder="Cari gudang..." empty-text="Gudang tidak ditemukan." @update:model-value="value => filters.warehouse_id = value ? Number(value) : null" />
          <ServerComboBox v-model="filters.branch_id" :fetcher="filterFetchers.branch_id" value-key="id" label-key="label" placeholder="Semua cabang" search-placeholder="Cari cabang..." empty-text="Cabang tidak ditemukan." @update:model-value="value => filters.branch_id = value ? Number(value) : null" />
          <ServerComboBox v-model="filters.product_variant_id" :fetcher="filterFetchers.product_variant_id" value-key="id" label-key="label" placeholder="Semua item" search-placeholder="Cari item / SKU..." empty-text="Item tidak ditemukan." @update:model-value="value => filters.product_variant_id = value ? Number(value) : null" />
        </div>

        <div v-if="itemsLoading" class="flex min-h-60 items-center justify-center">
          <Spinner class="size-8" />
        </div>

        <template v-else>
          <div v-if="displayedItems.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <HugeiconsIcon :icon="ShoppingBag01Icon" class="size-12 opacity-30 mb-2" />
            <p class="font-medium text-foreground">Tidak ada item Purchase Request yang siap dipesan</p>
            <p class="text-xs">Pastikan Purchase Request sudah disetujui dan masih memiliki sisa kuantitas.</p>
          </div>

          <template v-else>
          <!-- Tabel Pemilihan Item PR -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="toggleSelectAll(true)">Pilih Semua</Button>
                <Button variant="ghost" size="sm" @click="toggleSelectAll(false)">Batal Pilih</Button>
                <span class="text-xs text-muted-foreground ml-2">
                  <strong class="text-foreground">{{ selectedCount }}</strong> dari {{ displayedItems.length }} item terpilih
                </span>
              </div>
            </div>

            <div class="max-h-[50vh] overflow-x-auto overflow-y-auto overscroll-contain rounded-lg border">
              <table class="min-w-[1000px] w-full text-left text-sm">
                <thead class="sticky top-0 z-10 border-b bg-muted/95 text-xs text-muted-foreground">
                  <tr>
                    <th class="w-10 p-3 text-center"></th>
                    <th class="p-3">No. PR & Dokumen</th>
                    <th class="p-3">Produk / Varian</th>
                    <th class="p-3 text-right">Sisa Permintaan</th>
                    <th class="w-40 p-3 text-right">Qty Pesan / Satuan</th>
                    <th class="w-56 p-3">Pemasok (Supplier)</th>
                    <th class="w-36 p-3 text-right">Harga Beli</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="item in displayedItems"
                    :key="item.purchase_request_item_id"
                    :class="itemStates[item.purchase_request_item_id]?.selected ? 'bg-primary/5' : 'hover:bg-muted/10'"
                  >
                    <td class="p-3 text-center">
                      <Checkbox
                        :key="`${item.purchase_request_item_id}-${itemStates[item.purchase_request_item_id]?.selected ? 'checked' : 'unchecked'}`"
                        :model-value="itemStates[item.purchase_request_item_id]?.selected === true"
                        :aria-label="`Pilih ${item.product_name}`"
                        @update:model-value="checked => setItemSelected(item.purchase_request_item_id, checked)"
                      />
                    </td>
                    <td class="p-3 whitespace-nowrap">
                      <p class="font-mono text-xs font-semibold text-foreground">{{ item.document_number }}</p>
                      <p class="text-[11px] text-muted-foreground">{{ item.warehouse_name }}</p>
                    </td>
                    <td class="p-3">
                      <p class="font-medium text-foreground">{{ item.product_name }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ item.variant_name ? `${item.variant_name} · ` : '' }}SKU: {{ item.sku }}
                      </p>
                    </td>
                    <td class="p-3 text-right whitespace-nowrap">
                      <span class="font-medium text-amber-600 dark:text-amber-400">
                        {{ quantityFormat.format(Number(item.remaining_base_quantity)) }} (dasar)
                      </span>
                    </td>
                    <td class="p-2">
                      <InputGroup class="h-9">
                        <InputGroupInput
                          v-model="itemStates[item.purchase_request_item_id].unit_quantity"
                          type="number"
                          step="any"
                          min="0"
                          class="text-right"
                          :disabled="!itemStates[item.purchase_request_item_id]?.selected"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>{{ item.unit_code || 'unit' }}</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </td>
                    <td class="p-2">
                      <ComboboxSelect
                        :model-value="itemStates[item.purchase_request_item_id]?.supplier_id ? String(itemStates[item.purchase_request_item_id].supplier_id) : ''"
                        :options="supplierOptions"
                        placeholder="Pilih supplier"
                        search-placeholder="Cari supplier..."
                        :disabled="!itemStates[item.purchase_request_item_id]?.selected"
                        @update:model-value="val => itemStates[item.purchase_request_item_id].supplier_id = val ? Number(val) : null"
                      />
                    </td>
                    <td class="p-2 text-right">
                      <MoneyInput
                        v-model="itemStates[item.purchase_request_item_id].unit_price"
                        class="h-9 text-right"
                        placeholder="0"
                        :disabled="!itemStates[item.purchase_request_item_id]?.selected"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Preview Purchase Order yang akan dibuat -->
          <div v-if="previewGroups.length > 0" class="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
            <h4 class="text-sm font-semibold flex items-center gap-1.5">
              <HugeiconsIcon :icon="ShoppingBag01Icon" class="size-4 text-primary" aria-hidden="true" />
              Rencana Purchase Order yang Akan Dibuat ({{ previewGroups.length }} Dokumen PO)
            </h4>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div
                v-for="(grp, idx) in previewGroups"
                :key="idx"
                class="rounded-lg border bg-background p-3 text-xs flex flex-col gap-2"
              >
                <div class="flex items-center justify-between border-b pb-1.5">
                  <span class="font-semibold text-foreground flex items-center gap-1">
                    <HugeiconsIcon :icon="DeliveryTruck01Icon" class="size-3.5 text-primary" />
                    {{ grp.supplier_name }}
                  </span>
                  <Badge variant="outline">{{ grp.warehouse_name }}</Badge>
                </div>
                <div class="flex flex-col gap-1 text-muted-foreground">
                  <div
                    v-for="(entry, eIdx) in grp.items"
                    :key="eIdx"
                    class="flex items-center justify-between"
                  >
                    <span class="truncate max-w-[200px]">{{ entry.item.product_name }}</span>
                    <span>
                      {{ quantityFormat.format(Number(entry.state.unit_quantity)) }} {{ entry.item.unit_code }} × {{ currencyFormat.format(Number(entry.state.unit_price)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </template>
        </template>
        </div>
      </div>

      <DialogFooter class="-mx-6 -mb-6 rounded-b-xl border-t p-4">
        <Button variant="outline" :disabled="loading" @click="open = false">Batal</Button>
        <Button
          :disabled="loading || previewGroups.length === 0"
          @click="handleConvert"
        >
          <Spinner v-if="loading" data-icon="inline-start" />
          {{ loading ? 'Membuat PO...' : `Buat ${previewGroups.length} Purchase Order` }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
