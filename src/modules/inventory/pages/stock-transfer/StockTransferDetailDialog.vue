<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ArrowRight01Icon, CheckmarkCircleIcon, PackageCheck, CancelCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { stockTransferService } from '../../services/stock-transfer.service'
import type { StockTransfer } from '../../types/stock-transfer.types'
import { normalizeError } from '@/lib/errors'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ transferId?: number }>()
const emit = defineEmits<{ changed: [] }>()
const transfer = ref<StockTransfer>()
const error = ref('')
const loading = ref(false)
const received = reactive<Record<number, number | string>>({})
const receiveNotes = ref('')
const cancelReason = ref('')
const statusLabels: Record<string, string> = { draft: 'Draft', shipped: 'Dikirim', received: 'Diterima', cancelled: 'Dibatalkan' }
const quantity = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const variance = computed(() => transfer.value?.items.some(item => Number(received[item.id ?? 0] ?? item.base_quantity) < Number(item.base_quantity)) ?? false)

watch([open, () => props.transferId], async ([isOpen, id]) => { if (isOpen && id) await load(id) })

async function load(id: number) {
  loading.value = true
  error.value = ''
  try {
    transfer.value = await stockTransferService.show(id)
    Object.keys(received).forEach(key => delete received[Number(key)])
    receiveNotes.value = ''
    cancelReason.value = ''
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}

async function execute(action: 'ship' | 'receive' | 'cancel') {
  if (!transfer.value) return
  loading.value = true
  error.value = ''
  try {
    if (action === 'ship') transfer.value = await stockTransferService.ship(transfer.value.id)
    else if (action === 'receive') transfer.value = await stockTransferService.receive(transfer.value.id, received, receiveNotes.value || null)
    else transfer.value = await stockTransferService.cancel(transfer.value.id, cancelReason.value)
    emit('changed')
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-5xl">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><HugeiconsIcon :icon="PackageCheck" aria-hidden="true" /></div>
          <div class="flex min-w-0 flex-col gap-1"><DialogTitle class="truncate">Transfer Stok {{ transfer?.document_number }}</DialogTitle><DialogDescription>Rincian perpindahan stok antar gudang.</DialogDescription></div>
        </div>
      </DialogHeader>

      <div v-if="loading" class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">Memuat detail transfer...</div>

      <template v-else-if="transfer">
        <Alert v-if="error" variant="destructive"><AlertTitle>Gagal memproses transfer</AlertTitle><AlertDescription>{{ error }}</AlertDescription></Alert>

        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Informasi Transfer</h3>
            <p class="text-xs text-muted-foreground">Ringkasan dokumen dan lokasi perpindahan stok.</p>
          </header>
          <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="flex min-w-0 items-center gap-3"><HugeiconsIcon :icon="PackageCheck" class="size-5 shrink-0 text-primary" aria-hidden="true" /><div class="min-w-0"><p class="text-xs text-muted-foreground">Status</p><Badge :variant="transfer.status === 'cancelled' ? 'destructive' : transfer.status === 'received' ? 'default' : 'secondary'" class="mt-1">{{ statusLabels[transfer.status] }}</Badge></div></div>
            <div class="flex min-w-0 items-center gap-3"><HugeiconsIcon :icon="ArrowRight01Icon" class="size-5 shrink-0 text-primary" aria-hidden="true" /><div class="min-w-0"><p class="text-xs text-muted-foreground">Tanggal Transfer</p><p class="truncate text-sm font-medium">{{ transfer.transfer_date }}</p></div></div>
            <div class="flex min-w-0 items-center gap-3"><HugeiconsIcon :icon="ArrowRight01Icon" class="size-5 shrink-0 text-primary" aria-hidden="true" /><div class="min-w-0"><p class="text-xs text-muted-foreground">Gudang Asal</p><p class="truncate text-sm font-medium" :title="transfer.from_warehouse_name">{{ transfer.from_warehouse_name }}</p></div></div>
            <div class="flex min-w-0 items-center gap-3"><HugeiconsIcon :icon="ArrowRight01Icon" class="size-5 shrink-0 rotate-180 text-primary" aria-hidden="true" /><div class="min-w-0"><p class="text-xs text-muted-foreground">Gudang Tujuan</p><p class="truncate text-sm font-medium" :title="transfer.to_warehouse_name">{{ transfer.to_warehouse_name }}</p></div></div>
            <div v-if="transfer.notes" class="flex min-w-0 items-start gap-3 border-t pt-3 sm:col-span-2 lg:col-span-4"><HugeiconsIcon :icon="CheckmarkCircleIcon" class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div class="min-w-0"><p class="text-xs text-muted-foreground">Catatan Transfer</p><p class="whitespace-pre-wrap text-sm">{{ transfer.notes }}</p></div></div>
          </div>
        </section>

        <section class="overflow-hidden rounded-xl border">
          <header class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3">
            <div><h3 class="text-sm font-semibold">Item Transfer</h3><p class="text-xs text-muted-foreground">{{ transfer.items.length }} item dalam transfer ini.</p></div>
          </header>
          <div class="overflow-x-auto"><table class="w-full min-w-[700px] text-left text-sm"><thead class="border-y bg-muted/40 text-xs text-muted-foreground"><tr><th class="p-3">Produk / Varian</th><th class="p-3 text-right">Dikirim</th><th class="p-3 text-right">Diterima</th><th class="p-3 text-right">Selisih</th></tr></thead><tbody class="divide-y"><tr v-for="item in transfer.items" :key="item.id" class="hover:bg-muted/20"><td class="p-3"><p class="font-medium">{{ item.product_name }}</p><p class="text-xs text-muted-foreground">{{ item.variant_name || 'Default' }} · SKU: {{ item.sku }} · {{ item.unit_name }}</p><p v-if="item.notes" class="mt-0.5 text-xs italic text-muted-foreground">{{ item.notes }}</p></td><td class="whitespace-nowrap p-3 text-right font-medium">{{ quantity.format(Number(item.unit_quantity)) }} {{ item.unit_code }}</td><td class="p-3 text-right"><Input v-if="transfer.status === 'shipped'" v-model="received[item.id!]" type="number" min="0" :max="Number(item.base_quantity)" step="any" class="ml-auto w-28 text-right" placeholder="Penuh" /><span v-else class="whitespace-nowrap">{{ item.received_base_quantity == null ? '—' : quantity.format(Number(item.received_base_quantity)) }}</span></td><td class="whitespace-nowrap p-3 text-right">{{ item.variance_base_quantity == null ? '—' : quantity.format(Number(item.variance_base_quantity)) }}</td></tr></tbody></table></div>
        </section>

        <section v-if="transfer.status === 'shipped'" class="rounded-lg border bg-muted/10 p-4"><label class="text-sm font-medium">Catatan Penerimaan <span v-if="variance" class="text-destructive">(wajib karena ada selisih)</span></label><p class="mb-2 text-xs text-muted-foreground">Tambahkan catatan jika jumlah diterima berbeda dari jumlah yang dikirim.</p><Textarea v-model="receiveNotes" rows="2" placeholder="Catatan selisih / kondisi barang..." /></section>
        <section v-if="transfer.status === 'draft' || transfer.status === 'shipped'" class="rounded-lg border border-destructive/20 bg-destructive/5 p-4"><label class="text-sm font-medium">Alasan Pembatalan</label><p class="mb-2 text-xs text-muted-foreground">Pembatalan akan mengubah status transfer dan tidak dapat dibatalkan kembali.</p><Input v-model="cancelReason" placeholder="Alasan pembatalan..." /></section>
      </template>

      <DialogFooter class="flex flex-wrap items-center justify-between gap-2 border-t pt-4"><Button variant="outline" @click="open = false">Tutup</Button><div class="flex flex-wrap items-center gap-2"><Button v-if="transfer?.status === 'draft'" :disabled="loading" @click="execute('ship')"><HugeiconsIcon :icon="PackageCheck" data-icon="inline-start" /> Kirim</Button><Button v-if="transfer?.status === 'shipped'" :disabled="loading || (variance && !receiveNotes.trim())" @click="execute('receive')"><HugeiconsIcon :icon="CheckmarkCircleIcon" data-icon="inline-start" /> Terima</Button><Button v-if="transfer?.status === 'draft' || transfer?.status === 'shipped'" variant="destructive" :disabled="loading || !cancelReason.trim()" @click="execute('cancel')"><HugeiconsIcon :icon="CancelCircleIcon" data-icon="inline-start" /> Batalkan</Button></div></DialogFooter>
    </DialogContent>
  </Dialog>
</template>
