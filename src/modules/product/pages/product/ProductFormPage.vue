<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Barcode,
  Boxes,
  CircleDollarSign,
  Images,
  Layers,
  Package,
  Ruler,
  ShieldCheck,
  Store,
  Tag,
} from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoneyInput from "@/components/ui/input-group/MoneyInput.vue";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import ComboboxSelect from "@/components/ui/combobox/ComboboxSelect.vue";
import MultiSelectCombobox from "@/components/ui/combobox/MultiSelectCombobox.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { normalizeError } from "@/lib/errors";
import { toast } from "vue-sonner";
import { useCan } from "@/core/composables/useCan";
import type {
  Brand,
  Category,
  Product,
  ProductImage,
  Unit,
} from "@/core/types/product.types";
import type { BranchCombobox } from "@/core/types/branch.types";
import type { SupplierListItem } from "@/core/types/supplier.types";
import { branchService } from "@/modules/operational/services/branch.service";
import {
  productService,
  type ProductPayload,
  type ProductVariantPayload,
} from "../../services/product.service";
import api from "@/core/api/axios";

const route = useRoute();
const router = useRouter();
const { can } = useCan();

const productId = computed(() => Number(route.params.productId) || null);
const isEdit = computed(() => productId.value !== null);
const loading = ref(false);
const pageLoading = ref(false);
const lookupsLoading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const suppliers = ref<SupplierListItem[]>([]);
const units = ref<Unit[]>([]);
const branches = ref<BranchCombobox[]>([]);
const priceLists = ref<
  Array<{
    id: number;
    name: string;
    code?: string | null;
    is_default: boolean;
    is_active: boolean;
  }>
>([]);
const managedProduct = ref<Product>();
const selectedImages = ref<Array<{ file: File; preview: string }>>([]);
const removedImageIds = ref<number[]>([]);
const imageError = ref("");
const imageServerError = computed(
  () =>
    errors.value.images ??
    errors.value.remove_image_ids ??
    Object.entries(errors.value).find(([key]) =>
      key.startsWith("images."),
    )?.[1] ??
    "",
);
const existingImages = computed(() =>
  (managedProduct.value?.images ?? []).filter(
    (image) => !removedImageIds.value.includes(image.id),
  ),
);
const imageCount = computed(
  () => existingImages.value.length + selectedImages.value.length,
);
const branchForAllocation = ref<number | "">("");
const priceListForTier = ref<number | "">("");
const tierQuantity = ref<number | "">(2);
const tierPrice = ref<number | "">("");
const tierMode = ref<"fixed" | "margin" | "follow_center">("fixed");
const tierBranch = ref<number | "">("");
const priceBusy = ref(false);
const branchBusy = ref(false);
const branchAvailabilityLoading = ref(false);
const branchAvailability = ref<Record<number, { is_available: boolean; source: string | null; override_type: "include" | "exclude" | null }>>({});
const priceListName = ref("");
const priceListBusy = ref(false);
const addingVariant = ref(false);
const addVariantDialogOpen = ref(false);
const priceTierDialogOpen = ref(false);
const savingUnit = ref(false);
const unitDrafts = ref<Record<number, UnitDraft>>({});
const mode = ref<"simple" | "variants">("simple");

type UnitDraft = {
  unit_id: number | "";
  conversion_value: number | "";
  barcode: string;
  cost: number | "";
  default_price: number | "";
};
type VariantDraft = {
  sku: string;
  name: string;
  base_unit_id: number | "";
  barcode: string;
  cost: number | "";
  default_price: number | "";
  additional_units: UnitDraft[];
  images: Array<{ file: File; preview: string }>;
};
type FormDraft = {
  type: "product" | "service";
  name: string;
  description: string;
  brand_id: number | "";
  category_ids: number[];
  supplier_ids: number[];
  track_stock: boolean;
  is_taxable: boolean;
  tax_rate: number | "";
  min_stock: number | "";
  weight: number | "";
  is_active: boolean;
  sku: string;
  base_unit_id: number | "";
  barcode: string;
  cost: number | "";
  default_price: number | "";
  variants: VariantDraft[];
};

const newVariant = (): VariantDraft => ({
  sku: "",
  name: "",
  base_unit_id: "",
  barcode: "",
  cost: 0,
  default_price: 0,
  additional_units: [],
  images: [],
});
const newVariantDraft = ref<VariantDraft>(newVariant());
const freshForm = (): FormDraft => ({
  type: "product",
  name: "",
  description: "",
  brand_id: "",
  category_ids: [],
  supplier_ids: [],
  track_stock: true,
  is_taxable: false,
  tax_rate: "",
  min_stock: "",
  weight: "",
  is_active: true,
  sku: "",
  base_unit_id: "",
  barcode: "",
  cost: 0,
  default_price: 0,
  variants: [newVariant()],
});
const form = ref<FormDraft>(freshForm());
const sharedUnitDraft = computed(() => {
  const draft = form.value.variants[0];
  if (!draft) throw new Error("Product form must keep a default variant.");
  return draft;
});
const activeVariants = computed(
  () =>
    managedProduct.value?.variants?.filter((variant) => variant.is_active) ??
    [],
);
const inactiveVariants = computed(
  () =>
    managedProduct.value?.variants?.filter((variant) => !variant.is_active) ??
    [],
);

function messageFor(key: string) {
  return errors.value[key] ?? "";
}
function variantBarcodeError(index: number) {
  return messageFor(`variants.${index}.barcode`) || messageFor("barcode");
}
function additionalUnitBarcodeError(variantIndex: number, unitIndex: number) {
  return messageFor(`variants.${variantIndex}.additional_units.${unitIndex}.barcode`);
}
function clearSelectedImages() {
  selectedImages.value.forEach((image) => URL.revokeObjectURL(image.preview));
  selectedImages.value = [];
  removedImageIds.value = [];
  imageError.value = "";
}

function resetForm() {
  clearSelectedImages();
  form.value.variants.forEach((variant) =>
    variant.images.forEach((image) => URL.revokeObjectURL(image.preview)),
  );
  newVariantDraft.value.images.forEach((image) =>
    URL.revokeObjectURL(image.preview),
  );
  unitDrafts.value = {};
  branchAvailability.value = {};
  managedProduct.value = undefined;
  form.value = freshForm();
  mode.value = "simple";
  errors.value = {};
  generalError.value = "";
}

async function loadLookups() {
  lookupsLoading.value = true;
  try {
    const results = await Promise.allSettled([
      api.get<{ data: Unit[] }>("/units", {
        params: { per_page: 100, filter: { is_active: 1 } },
      }),
      api.get<{ data: Category[] }>("/categories", {
        params: { per_page: 100, filter: { is_active: 1 } },
      }),
      api.get<{ data: Brand[] }>("/brands", {
        params: { per_page: 100, filter: { is_active: 1 } },
      }),
      api.get<{ data: SupplierListItem[] }>("/partner/suppliers", {
        params: { per_page: 100, filter: { is_active: 1 } },
      }),
      branchService.combobox(),
      productService.priceLists(),
    ] as const);
    const [
      unitResponse,
      categoryResponse,
      brandResponse,
      supplierResponse,
      branchResponse,
      lists,
    ] = results;
    if (unitResponse.status === "fulfilled")
      units.value = unitResponse.value.data.data;
    else generalError.value = normalizeError(unitResponse.reason).message;
    if (categoryResponse.status === "fulfilled")
      categories.value = categoryResponse.value.data.data;
    else generalError.value ||= normalizeError(categoryResponse.reason).message;
    if (brandResponse.status === "fulfilled")
      brands.value = brandResponse.value.data.data;
    else generalError.value ||= normalizeError(brandResponse.reason).message;
    if (supplierResponse.status === "fulfilled")
      suppliers.value = supplierResponse.value.data.data;
    else generalError.value ||= normalizeError(supplierResponse.reason).message;
    if (branchResponse.status === "fulfilled")
      branches.value = branchResponse.value.data;
    if (lists.status === "fulfilled") priceLists.value = lists.value;
  } catch (error) {
    generalError.value = normalizeError(error).message;
  } finally {
    lookupsLoading.value = false;
  }
}

function hydrateEdit(product: Product) {
  form.value = {
    ...freshForm(),
    type: product.type,
    name: product.name,
    description: product.description ?? "",
    brand_id: product.brand?.id ?? "",
    category_ids: product.categories?.map((category) => category.id) ?? [],
    supplier_ids: product.suppliers?.map((supplier) => supplier.id) ?? [],
    track_stock: product.track_stock,
    is_taxable: product.is_taxable,
    tax_rate:
      product.tax_rate === null || product.tax_rate === undefined
        ? ""
        : Number(product.tax_rate),
    min_stock:
      product.min_stock === null || product.min_stock === undefined
        ? ""
        : Number(product.min_stock),
    weight:
      product.weight === null || product.weight === undefined
        ? ""
        : Number(product.weight),
    is_active: product.is_active,
  };
}

async function loadPage() {
  pageLoading.value = true;
  errors.value = {};
  generalError.value = "";
  clearSelectedImages();
  newVariantDraft.value = newVariant();
  tierQuantity.value = 2;
  tierPrice.value = "";
  priceListForTier.value = "";
  tierBranch.value = "";
  branchForAllocation.value = "";
  if (productId.value) {
    managedProduct.value = undefined;
    resetForm();
    await loadLookups();
    try {
      const product = await productService.show(productId.value);
      managedProduct.value = product;
      hydrateEdit(product);
      resetNewVariantDraft();
    } catch (error) {
      generalError.value = normalizeError(error).message;
    } finally {
      pageLoading.value = false;
    }
  } else {
    resetForm();
    await loadLookups();
    pageLoading.value = false;
  }
}

watch(() => route.params.productId, loadPage, { immediate: true });

function onImagesSelected(event: Event) {
  imageError.value = "";
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (imageCount.value + files.length > 5) {
    imageError.value = "Maksimal lima gambar untuk satu produk.";
    input.value = "";
    return;
  }
  const invalidFile = files.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024,
  );
  if (invalidFile) {
    imageError.value = `${invalidFile.name}: gunakan JPG, PNG, atau WEBP maksimal 5 MB per gambar.`;
    input.value = "";
    return;
  }
  selectedImages.value.push(
    ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
  );
  input.value = "";
}

function removeSelectedImage(index: number) {
  const [removed] = selectedImages.value.splice(index, 1);
  if (removed) URL.revokeObjectURL(removed.preview);
  imageError.value = "";
}

function removeExistingImage(image: ProductImage) {
  removedImageIds.value.push(image.id);
  imageError.value = "";
}

function restoreExistingImage(imageId: number) {
  removedImageIds.value = removedImageIds.value.filter((id) => id !== imageId);
}

function addVariant() {
  const sharedBase = form.value.variants[0]?.base_unit_id ?? "";
  const sharedUnits = form.value.variants[0]?.additional_units ?? [];
  form.value.variants.push({
    ...newVariant(),
    base_unit_id: sharedBase,
    additional_units: sharedUnits.map((unit) => ({
      unit_id: unit.unit_id,
      conversion_value: unit.conversion_value,
      barcode: "",
      cost: 0,
      default_price: 0,
    })),
  });
}
function removeVariantDraft(index: number) {
  if (form.value.variants.length <= 1) return;
  form.value.variants[index]?.images.forEach((image) =>
    URL.revokeObjectURL(image.preview),
  );
  form.value.variants.splice(index, 1);
}
function syncSharedUnitDefinitions() {
  const master = form.value.variants[0];
  if (!master) return;
  master.additional_units = master.additional_units.filter(
    (unit) =>
      unit.unit_id === "" ||
      master.base_unit_id === "" ||
      Number(unit.unit_id) !== Number(master.base_unit_id),
  );
  for (const variant of form.value.variants.slice(1)) {
    const previousUnits = variant.additional_units;
    variant.base_unit_id = master.base_unit_id;
    variant.additional_units = master.additional_units
      .filter((unit) => Number(unit.unit_id) !== Number(master.base_unit_id))
      .map((sharedUnit, index) => {
        const metadata =
          previousUnits.find((unit) => unit.unit_id === sharedUnit.unit_id) ??
          previousUnits[index];
        return {
          unit_id: sharedUnit.unit_id,
          conversion_value: sharedUnit.conversion_value,
          barcode: metadata?.barcode ?? "",
          cost: metadata?.cost ?? 0,
          default_price: metadata?.default_price ?? 0,
        };
      });
  }
}
function removeSharedAdditionalUnit(index: number) {
  form.value.variants[0]?.additional_units.splice(index, 1);
  syncSharedUnitDefinitions();
}
function resetNewVariantDraft() {
  const sharedUnits = managedProduct.value?.units ?? [];
  const baseUnit = sharedUnits.find((unit) => unit.is_base);
  newVariantDraft.value = {
    ...newVariant(),
    base_unit_id: baseUnit?.unit.id ?? "",
    additional_units: sharedUnits
      .filter((unit) => !unit.is_base)
      .map((unit) => ({
        unit_id: unit.unit.id,
        conversion_value: unit.conversion_value,
        barcode: "",
        cost: 0,
        default_price: 0,
      })),
  };
}
function onVariantImagesSelected(event: Event, variant: VariantDraft) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (variant.images.length + files.length > 5) {
    toast.error("Maksimal lima gambar untuk satu varian.");
    input.value = "";
    return;
  }
  const invalid = files.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024,
  );
  if (invalid) {
    toast.error(`${invalid.name}: gunakan JPG, PNG, atau WEBP maksimal 5 MB.`);
    input.value = "";
    return;
  }
  variant.images.push(
    ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
  );
  input.value = "";
}
function removeVariantDraftImage(variant: VariantDraft, index: number) {
  const [image] = variant.images.splice(index, 1);
  if (image) URL.revokeObjectURL(image.preview);
}
async function onSavedVariantImageSelected(event: Event, variantId: number) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  const current =
    activeVariants.value.find((variant) => variant.id === variantId)?.images
      ?.length ?? 0;
  if (current + files.length > 5) {
    toast.error("Maksimal lima gambar untuk satu varian.");
    input.value = "";
    return;
  }
  const invalid = files.find(
    (file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024,
  );
  if (invalid) {
    toast.error(`${invalid.name}: gunakan JPG, PNG, atau WEBP maksimal 5 MB.`);
    input.value = "";
    return;
  }
  if (!managedProduct.value || files.length === 0) return;
  try {
    await productService.updateVariantImages(
      managedProduct.value.id,
      variantId,
      files,
    );
    await refreshManagedProduct();
    toast.success("Gambar varian berhasil ditambahkan.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    input.value = "";
  }
}
async function removeSavedVariantImage(variantId: number, imageId: number) {
  if (!managedProduct.value) return;
  try {
    await productService.updateVariantImages(
      managedProduct.value.id,
      variantId,
      [],
      [imageId],
    );
    await refreshManagedProduct();
    toast.success("Gambar varian dihapus.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  }
}
function addAdditionalUnit(variant: VariantDraft) {
  variant.additional_units.push({
    unit_id: "",
    conversion_value: "",
    barcode: "",
    cost: 0,
    default_price: 0,
  });
  if (
    mode.value === "variants" &&
    form.value.type === "product" &&
    variant === form.value.variants[0]
  ) {
    syncSharedUnitDefinitions();
  }
}

function baseUnitCode(variant: Product["variants"][number]) {
  return variant.units.find((unit) => unit.is_base)?.unit.code ?? "satuan dasar";
}

function startAddingVariantUnit(variantId: number) {
  unitDrafts.value[variantId] = {
    unit_id: "",
    conversion_value: "",
    barcode: "",
    cost: 0,
    default_price: 0,
  };
}

function cancelAddingVariantUnit(variantId: number) {
  delete unitDrafts.value[variantId];
}

async function saveVariantUnit(variantId: number) {
  if (!managedProduct.value) return;
  const draft = unitDrafts.value[variantId];
  if (!draft || draft.unit_id === "" || Number(draft.conversion_value) <= 0) {
    toast.error("Pilih satuan dan isi konversi lebih besar dari nol.");
    return;
  }
  savingUnit.value = true;
  try {
    await productService.addVariantUnit(variantId, {
      unit_id: Number(draft.unit_id),
      conversion_value: Number(draft.conversion_value),
      barcode: draft.barcode.trim() || undefined,
      cost: Number(draft.cost || 0),
      default_price: Number(draft.default_price || 0),
    });
    delete unitDrafts.value[variantId];
    await refreshManagedProduct();
    resetNewVariantDraft();
    toast.success("Satuan konversi berhasil ditambahkan.");
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 422) errors.value = normalized.errors;
    else toast.error(normalized.message);
  } finally {
    savingUnit.value = false;
  }
}

async function updateSavedVariantUnit(unit: Product["variants"][number]["units"][number]) {
  savingUnit.value = true;
  try {
    await productService.updateVariantUnit(unit.id, {
      conversion_value: Number(unit.conversion_value),
      barcode: unit.barcode || null,
      cost: Number(unit.cost || 0),
      default_price: Number(unit.default_price || 0),
    });
    await refreshManagedProduct();
    resetNewVariantDraft();
    toast.success("Satuan dan konversinya berhasil diperbarui.");
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 422) errors.value = normalized.errors;
    else toast.error(normalized.message);
  } finally {
    savingUnit.value = false;
  }
}

async function deleteSavedVariantUnit(unitId: number) {
  if (!window.confirm("Hapus satuan tambahan ini dari varian? Riwayat stok yang sudah tercatat tetap menggunakan konversi saat transaksi.")) return;
  savingUnit.value = true;
  try {
    await productService.deleteVariantUnit(unitId);
    await refreshManagedProduct();
    resetNewVariantDraft();
    toast.success("Satuan tambahan berhasil dihapus.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    savingUnit.value = false;
  }
}

async function refreshManagedProduct() {
  if (!managedProduct.value) return;
  managedProduct.value = await productService.show(managedProduct.value.id);
  if (branchForAllocation.value !== "") await loadBranchAvailability();
}

async function loadBranchAvailability() {
  if (branchForAllocation.value === "") {
    branchAvailability.value = {};
    return;
  }
  branchAvailabilityLoading.value = true;
  try {
    const availability = await productService.productAvailabilityAtBranch(
      Number(branchForAllocation.value),
    );
    branchAvailability.value = Object.fromEntries(availability.map((item) => [item.product_variant_id, {
      is_available: item.is_available,
      source: item.source,
      override_type: item.override_type,
    }]));
  } catch (error) {
    branchAvailability.value = {};
    toast.error(`Gagal memuat ketersediaan cabang: ${normalizeError(error).message}`);
  } finally {
    branchAvailabilityLoading.value = false;
  }
}

watch(branchForAllocation, loadBranchAvailability);

async function submitNewVariant() {
  if (!managedProduct.value) return;
  errors.value = {};
  addingVariant.value = true;
  try {
    await productService.addVariant(
      managedProduct.value.id,
      asVariantPayload(newVariantDraft.value, 1),
    );
    newVariantDraft.value.images.forEach((image) =>
      URL.revokeObjectURL(image.preview),
    );
    await refreshManagedProduct();
    resetNewVariantDraft();
    addVariantDialogOpen.value = false;
    toast.success("Varian berhasil ditambahkan.");
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 422) errors.value = normalized.errors;
    else toast.error(normalized.message);
  } finally {
    addingVariant.value = false;
  }
}

async function deactivateVariant(variantId: number) {
  if (!managedProduct.value) return;
  if (
    !window.confirm(
      "Nonaktifkan varian ini? Varian tidak akan dapat dipilih untuk transaksi baru.",
    )
  )
    return;
  branchBusy.value = true;
  try {
    await productService.deactivateVariant(managedProduct.value.id, variantId);
    await refreshManagedProduct();
    toast.success("Varian berhasil dinonaktifkan.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    branchBusy.value = false;
  }
}

async function reactivateVariant(variantId: number) {
  if (!managedProduct.value) return;
  branchBusy.value = true;
  try {
    await productService.setVariantActive(
      managedProduct.value.id,
      variantId,
      true,
    );
    await refreshManagedProduct();
    toast.success("Varian berhasil diaktifkan kembali.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    branchBusy.value = false;
  }
}

async function removePriceTier(variantUnitId: number, priceId: number) {
  if (!managedProduct.value) return;
  if (!window.confirm("Hapus aturan harga bertingkat ini?")) return;
  priceBusy.value = true;
  try {
    await productService.deleteUnitPrice(variantUnitId, priceId);
    await refreshManagedProduct();
    toast.success("Aturan harga berhasil dihapus.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    priceBusy.value = false;
  }
}

async function addPriceTier(variantUnitId: number) {
  if (
    tierPrice.value === "" ||
    Number(tierPrice.value) < 0 ||
    Number(tierQuantity.value) <= 1
  ) {
    toast.error("Isi harga dan kuantitas minimum di atas 1.");
    return;
  }
  priceBusy.value = true;
  try {
    await productService.createUnitPrice(variantUnitId, {
      price_list_id:
        priceListForTier.value === "" ? null : Number(priceListForTier.value),
      branch_id: tierBranch.value === "" ? null : Number(tierBranch.value),
      min_qty: Number(tierQuantity.value),
      price: Number(tierPrice.value),
      pricing_mode: tierMode.value,
    });
    toast.success("Harga bertingkat berhasil ditambahkan.");
    tierQuantity.value = 2;
    tierPrice.value = "";
    await refreshManagedProduct();
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    priceBusy.value = false;
  }
}

async function createPriceList() {
  if (!priceListName.value.trim())
    return toast.error("Nama daftar harga wajib diisi.");
  priceListBusy.value = true;
  try {
    const created = await productService.createPriceList({
      name: priceListName.value.trim(),
      is_default: priceLists.value.length === 0,
    });
    priceLists.value = [...priceLists.value, created];
    priceListForTier.value = created.id;
    priceListName.value = "";
    toast.success("Daftar harga berhasil dibuat.");
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    priceListBusy.value = false;
  }
}

async function setBranchAvailability(
  variantId: number,
  override: "include" | "exclude" | "inherit",
) {
  if (branchForAllocation.value === "")
    return toast.error("Pilih cabang terlebih dahulu.");
  branchBusy.value = true;
  try {
    if (override === "inherit")
      await productService.clearVariantBranchOverride(
        Number(branchForAllocation.value),
        variantId,
      );
    else
      await productService.includeVariantAtBranch(
        Number(branchForAllocation.value),
        variantId,
        override,
      );
    await loadBranchAvailability();
    toast.success(
      override === "inherit"
        ? "Override cabang dihapus."
        : `Ketersediaan varian diperbarui: ${override === "include" ? "tersedia" : "tidak tersedia"}.`,
    );
  } catch (error) {
    toast.error(normalizeError(error).message);
  } finally {
    branchBusy.value = false;
  }
}

function asVariantPayload(
  variant: VariantDraft,
  index: number,
): ProductVariantPayload {
  return {
    sku: variant.sku.trim(),
    name: variant.name.trim() || undefined,
    is_default: index === 0,
    base_unit_id: Number(variant.base_unit_id),
    barcode: variant.barcode.trim() || undefined,
    cost: Number(variant.cost || 0),
    default_price: Number(variant.default_price || 0),
    additional_units: variant.additional_units.map((unit) => ({
      unit_id: Number(unit.unit_id),
      conversion_value: Number(unit.conversion_value),
      barcode: unit.barcode.trim() || undefined,
      cost: Number(unit.cost || 0),
      default_price: Number(unit.default_price || 0),
    })),
    images: variant.images.map((image) => image.file),
  };
}

async function submit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";
  const common = {
    type: form.value.type,
    name: form.value.name.trim(),
    description: form.value.description.trim() || undefined,
    brand_id: form.value.brand_id === "" ? null : Number(form.value.brand_id),
    category_ids: form.value.category_ids.map(Number),
    supplier_ids: form.value.type === "product" ? form.value.supplier_ids.map(Number) : [],
    track_stock: form.value.type === "service" ? false : form.value.track_stock,
    is_taxable: form.value.is_taxable,
    tax_rate: form.value.is_taxable ? Number(form.value.tax_rate) : null,
    min_stock:
      form.value.min_stock === "" ? null : Number(form.value.min_stock),
    weight: form.value.weight === "" ? null : Number(form.value.weight),
  };
  try {
    let product: Product;
    if (isEdit.value && productId.value) {
      product = await productService.updateWithImages(
        productId.value,
        { ...common, is_active: form.value.is_active },
        selectedImages.value.map((image) => image.file),
        removedImageIds.value,
      );
    } else {
      const payload: ProductPayload =
        mode.value === "simple" || form.value.type === "service"
          ? {
              ...common,
              variants: [
                asVariantPayload(
                  {
                    ...newVariant(),
                    sku: form.value.sku,
                    base_unit_id: form.value.base_unit_id,
                    barcode: form.value.barcode,
                    cost: form.value.cost,
                    default_price: form.value.default_price,
                    additional_units:
                      form.value.variants[0]?.additional_units ?? [],
                    images: form.value.variants[0]?.images ?? [],
                  },
                  0,
                ),
              ],
            }
          : { ...common, variants: form.value.variants.map(asVariantPayload) };
      product = await productService.storeWithImages(
        payload,
        selectedImages.value.map((image) => image.file),
      );
    }
    toast.success(
      `Produk ${product.name} berhasil ${isEdit.value ? "diperbarui" : "ditambahkan"}.`,
    );
    await router.push({ name: "products.index" });
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 422) {
      errors.value = normalized.errors;
      generalError.value = normalized.message;
    }
    else generalError.value = normalized.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Package class="size-6 text-primary" />
            {{ isEdit ? "Ubah produk" : "Tambah produk" }}
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Lengkapi informasi produk, harga, pajak, dan gambar dalam satu
            halaman.
          </p>
        </div>
      </div>
      <div
        v-if="isEdit && managedProduct"
        class="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        {{ managedProduct.variants?.length ?? 0 }} varian · {{ imageCount }}/5
        gambar
      </div>
    </header>

    <div
      v-if="pageLoading"
      class="flex min-h-60 items-center justify-center gap-3 rounded-xl border bg-card text-sm text-muted-foreground"
    >
      <Spinner /> Memuat data produk…
    </div>
    <Alert v-if="generalError" variant="destructive"
      ><AlertTitle>{{
        pageLoading ? "Memuat data produk" : "Gagal memuat atau menyimpan"
      }}</AlertTitle
      ><AlertDescription>{{ generalError }}</AlertDescription></Alert
    >

    <form v-if="!pageLoading" @submit.prevent="submit" class="space-y-6">
      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <FieldGroup class="space-y-6">
          <div
            v-if="lookupsLoading"
            class="flex items-center gap-2 py-3 text-sm text-muted-foreground"
          >
            <Spinner /> Memuat kategori, merek, dan satuan…
          </div>
          <template v-else>
            <section class="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              <div>
                <h2 class="flex items-center gap-2 font-semibold"><Package class="size-4 text-primary" />Informasi produk</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  Nama dan pengelompokan yang tampil di katalog.
                </p>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <Field :data-invalid="!!messageFor('name')"
                  ><FieldLabel for="product-name">Nama Produk</FieldLabel
                  ><Input
                    id="product-name"
                    v-model="form.name"
                    required
                    maxlength="255"
                    placeholder="Contoh: Kopi Arabika"
                  /><FieldError>{{ messageFor("name") }}</FieldError></Field
                >
                <Field
                  ><FieldLabel for="product-type">Jenis</FieldLabel
                  ><ComboboxSelect
                    id="product-type"
                    v-model="form.type"
                    :options="[
                      { value: 'product', label: 'Produk fisik' },
                      { value: 'service', label: 'Jasa' },
                    ]"
                    placeholder="Pilih jenis"
                    :disabled="isEdit"
                /></Field>
                <Field
                  ><FieldLabel for="product-brand">Merek</FieldLabel
                  ><ComboboxSelect
                    id="product-brand"
                    v-model="form.brand_id"
                    :options="[
                      { value: '', label: 'Tanpa merek' },
                      ...brands.map((brand) => ({
                        value: brand.id,
                        label: brand.name,
                      })),
                    ]"
                    placeholder="Pilih merek"
                    search-placeholder="Cari merek..."
                  /><FieldError>{{ messageFor("brand_id") }}</FieldError></Field
                >
                <Field>
                  <FieldLabel>Kategori</FieldLabel>
                  <MultiSelectCombobox
                    v-model="form.category_ids"
                    :options="categories.map((category) => ({ value: category.id, label: category.name }))"
                    placeholder="Pilih kategori"
                    search-placeholder="Cari kategori..."
                    empty-text="Kategori tidak ditemukan."
                  />
                  <p v-if="categories.length === 0" class="text-xs text-muted-foreground">
                    Belum ada kategori aktif.
                  </p>
                  <p v-else class="text-xs text-muted-foreground">
                    Pilih satu atau beberapa kategori. Pilihan tampil ringkas di bawah.
                  </p>
                  <FieldError>{{ messageFor("category_ids") }}</FieldError>
                </Field>
                <Field v-if="form.type === 'product'" class="sm:col-span-2">
                  <FieldLabel>Supplier produk (opsional)</FieldLabel>
                  <MultiSelectCombobox
                    v-model="form.supplier_ids"
                    :options="suppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.name} (${supplier.code})` }))"
                    placeholder="Produk ini belum terikat ke supplier"
                    search-placeholder="Cari supplier..."
                    empty-text="Supplier tidak ditemukan."
                    selected-label="supplier dipilih"
                  />
                  <p class="text-xs text-muted-foreground">Produk dapat dimiliki beberapa supplier. Produk tanpa supplier tetap tersedia untuk semua supplier pada PO dan penerimaan.</p>
                  <FieldError>{{ messageFor("supplier_ids") }}</FieldError>
                </Field>
              </div>
              <Field
                ><FieldLabel for="product-description">Deskripsi</FieldLabel
                ><Textarea
                  id="product-description"
                  v-model="form.description"
                  rows="2"
                  placeholder="Informasi tambahan produk"
              /></Field>
            </section>

            <section
              v-if="!isEdit"
              class="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="flex items-center gap-2 font-medium">
                    <Layers class="size-4 text-primary" />
                    {{
                      form.type === "service"
                        ? "SKU dan satuan"
                        : "Varian dan satuan"
                    }}
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    {{
                      form.type === "service"
                        ? "Jasa tetap memerlukan SKU dan satuan transaksi."
                        : "Produk sederhana tetap memiliki satu varian default."
                    }}
                  </p>
                </div>
                <div v-if="form.type === 'product'" class="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    :variant="mode === 'simple' ? 'default' : 'outline'"
                    @click="mode = 'simple'"
                    >Sederhana</Button
                  ><Button
                    type="button"
                    size="sm"
                    :variant="mode === 'variants' ? 'default' : 'outline'"
                    @click="mode = 'variants'"
                    >Multi-varian</Button
                  >
                </div>
              </div>
              <template v-if="mode === 'simple' || form.type === 'service'">
                <div class="grid gap-4 sm:grid-cols-2">
                  <Field :data-invalid="!!messageFor('sku')"
                    ><FieldLabel for="sku">SKU</FieldLabel
                    ><Input
                      id="sku"
                      v-model="form.sku"
                      required
                      maxlength="255"
                      placeholder="KOPI-ARB-250"
                    /><FieldError>{{ messageFor("sku") }}</FieldError></Field
                  >
                  <Field :data-invalid="!!messageFor('base_unit_id')"
                    ><FieldLabel for="base-unit">Satuan dasar</FieldLabel
                    ><ComboboxSelect
                      id="base-unit"
                      v-model="form.base_unit_id"
                      :options="
                        units
                          .filter((unit) => !form.variants[0]?.additional_units.some((extra) => Number(extra.unit_id) === unit.id))
                          .map((unit) => ({
                          value: unit.id,
                          label: `${unit.name} (${unit.code})`,
                        }))
                      "
                      placeholder="Pilih satuan"
                      search-placeholder="Cari satuan..."
                    /><FieldError>{{
                      messageFor("base_unit_id")
                    }}</FieldError></Field
                  >
                  <Field
                    :data-invalid="!!variantBarcodeError(0)"
                    ><FieldLabel for="barcode">Barcode (opsional)</FieldLabel
                    ><Input id="barcode" v-model="form.barcode" :aria-invalid="!!variantBarcodeError(0)"
                  /><FieldError>{{ variantBarcodeError(0) }}</FieldError></Field>
                  <Field
                    ><FieldLabel for="cost"
                      >Biaya referensi / HPP awal</FieldLabel
                    ><MoneyInput
                      id="cost"
                      v-model="form.cost"
                  /></Field>
                  <Field
                    ><FieldLabel for="default-price"
                      >Harga jual dasar</FieldLabel
                    ><MoneyInput
                      id="default-price"
                      v-model="form.default_price"
                  /></Field>
                </div>
                <div class="space-y-3 rounded-md border bg-background p-3">
                  <div class="flex items-center justify-between gap-3"><div><p class="flex items-center gap-2 text-sm font-medium"><Ruler class="size-4 text-primary" />Satuan tambahan</p><p class="text-xs text-muted-foreground">Contoh: 1 dus = 12 pcs. Harga dan barcode dapat diatur untuk setiap satuan.</p></div><Button type="button" size="sm" variant="outline" @click="addAdditionalUnit(form.variants[0])">Tambah satuan</Button></div>
                  <div v-for="(extra, extraIndex) in form.variants[0].additional_units" :key="extraIndex" class="grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2">
                    <Field><FieldLabel>Satuan tambahan</FieldLabel><ComboboxSelect v-model="extra.unit_id" :options="units.filter((unit) => unit.id !== form.base_unit_id).map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))" placeholder="Pilih satuan" search-placeholder="Cari satuan..." /></Field>
                    <Field><FieldLabel>Konversi ke satuan dasar</FieldLabel><div class="flex items-center gap-2"><span class="shrink-0 text-sm">1 {{ units.find((unit) => unit.id === extra.unit_id)?.code || 'satuan' }} =</span><Input v-model.number="extra.conversion_value" type="number" min="0.0001" step="any" required/><span class="text-sm">{{ units.find((unit) => unit.id === form.base_unit_id)?.code || 'dasar' }}</span></div></Field>
                    <Field><FieldLabel>Harga jual satuan</FieldLabel><MoneyInput v-model="extra.default_price" /></Field>
                    <Field :data-invalid="!!additionalUnitBarcodeError(0, extraIndex)"><FieldLabel>Barcode (opsional)</FieldLabel><Input v-model="extra.barcode" :aria-invalid="!!additionalUnitBarcodeError(0, extraIndex)" /><FieldError>{{ additionalUnitBarcodeError(0, extraIndex) }}</FieldError></Field>
                    <div class="flex items-end"><Button type="button" variant="ghost" class="text-destructive" @click="form.variants[0].additional_units.splice(extraIndex, 1)">Hapus satuan</Button></div>
                  </div>
                </div>
                <div class="space-y-2 rounded-md border bg-muted/20 p-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="flex items-center gap-2 text-sm font-medium"><Images class="size-4 text-primary" />Gambar varian default</p>
                      <p class="text-xs text-muted-foreground">
                        Opsional, maksimal lima gambar untuk varian ini.
                      </p>
                    </div>
                    <label
                      class="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                      >Tambah gambar<Input
                        type="file"
                        class="sr-only"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        :disabled="form.variants[0].images.length >= 5"
                        @change="
                          onVariantImagesSelected($event, form.variants[0])
                        "
                    /></label>
                  </div>
                  <div
                    v-if="form.variants[0].images.length"
                    class="grid grid-cols-5 gap-2"
                  >
                    <div
                      v-for="(image, imageIndex) in form.variants[0].images"
                      :key="image.preview"
                      class="relative aspect-square overflow-hidden rounded-md border"
                    >
                      <img
                        :src="image.preview"
                        :alt="image.file.name"
                        class="size-full object-cover"
                      /><button
                        type="button"
                        class="absolute right-1 top-1 rounded-full bg-background/90 px-1.5 text-sm"
                        aria-label="Hapus gambar varian"
                        @click="
                          removeVariantDraftImage(form.variants[0], imageIndex)
                        "
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else-if="form.type === 'product'">
                <section v-if="sharedUnitDraft" class="space-y-4 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="flex gap-3">
                      <div class="rounded-md bg-primary/10 p-2 text-primary"><Ruler class="size-5" /></div>
                      <div>
                        <h4 class="flex items-center gap-2 font-semibold">Satuan dan konversi produk <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{{ form.variants.length }} varian</span></h4>
                        <p class="mt-1 text-sm text-muted-foreground">Atur sekali di sini. Satuan dasar dan rasio konversi yang sama akan digunakan oleh semua varian.</p>
                      </div>
                    </div>
                  </div>
                  <div v-if="form.variants.length > 1" class="flex gap-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm">
                    <Boxes class="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <p><strong>Produk memiliki {{ form.variants.length }} varian.</strong> Jangan atur konversi per varian. Semua varian memakai satuan dan rasio yang ditentukan di bagian ini; SKU, barcode, HPP, dan harga tetap dapat berbeda per varian.</p>
                  </div>
                  <Field :data-invalid="!!messageFor('variants.0.base_unit_id')" class="max-w-md">
                    <FieldLabel>Satuan dasar bersama</FieldLabel>
                    <ComboboxSelect
                      v-model="sharedUnitDraft.base_unit_id"
                      @update:model-value="syncSharedUnitDefinitions"
                      :options="units.filter((unit) => !sharedUnitDraft.additional_units.some((extra) => Number(extra.unit_id) === unit.id)).map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))"
                      placeholder="Pilih satuan dasar"
                      search-placeholder="Cari satuan..."
                    />
                    <FieldError>{{ messageFor("variants.0.base_unit_id") }}</FieldError>
                  </Field>
                  <div class="space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p class="flex items-center gap-2 text-sm font-medium"><Ruler class="size-4 text-muted-foreground" />Satuan tambahan bersama</p>
                        <p class="text-xs text-muted-foreground">Rasio konversi di bawah berlaku untuk semua varian.</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" @click="addAdditionalUnit(sharedUnitDraft)">Tambah satuan</Button>
                    </div>
                    <div v-if="!sharedUnitDraft.additional_units.length" class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada satuan tambahan. Tambahkan jika produk dijual dalam kemasan lain.</div>
                    <div v-for="(extra, extraIndex) in sharedUnitDraft.additional_units" :key="extraIndex" class="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[minmax(180px,1fr)_minmax(220px,1fr)_auto] sm:items-end">
                      <Field>
                        <FieldLabel>Satuan tambahan</FieldLabel>
                        <ComboboxSelect
                          v-model="extra.unit_id"
                          @update:model-value="syncSharedUnitDefinitions"
                          :options="units.filter((unit) => unit.id !== sharedUnitDraft.base_unit_id && !sharedUnitDraft.additional_units.some((other, index) => index !== extraIndex && Number(other.unit_id) === unit.id)).map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))"
                          placeholder="Pilih satuan"
                          search-placeholder="Cari satuan..."
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Konversi ke satuan dasar</FieldLabel>
                        <div class="flex items-center gap-2">
                          <span class="shrink-0 text-sm">1 {{ units.find((unit) => unit.id === extra.unit_id)?.code || "satuan" }} =</span>
                          <Input v-model.number="extra.conversion_value" @update:model-value="syncSharedUnitDefinitions" type="number" min="0.0001" step="any" required />
                          <span class="text-sm">{{ units.find((unit) => unit.id === sharedUnitDraft.base_unit_id)?.code || "dasar" }}</span>
                        </div>
                      </Field>
                      <Button type="button" variant="ghost" class="text-destructive" @click="removeSharedAdditionalUnit(extraIndex)">Hapus</Button>
                    </div>
                    <FieldError>{{ messageFor("variants.0.additional_units") }}</FieldError>
                  </div>
                </section>
                <div
                  v-for="(variant, index) in form.variants"
                  :key="index"
                  class="space-y-4 rounded-md bg-muted/40 p-4"
                >
                  <div class="flex items-center justify-between">
                    <h4 class="flex items-center gap-2 font-medium">
                      <Tag class="size-4 text-primary" />
                      Varian {{ index + 1 }}
                      <span
                        v-if="index === 0"
                        class="text-xs text-muted-foreground"
                        >(default)</span
                      >
                    </h4>
                    <Button
                      v-if="form.variants.length > 1"
                      type="button"
                      variant="ghost"
                      size="sm"
                      @click="removeVariantDraft(index)"
                      >Hapus</Button
                    >
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2">
                    <Field :data-invalid="!!messageFor(`variants.${index}.sku`)"
                      ><FieldLabel>SKU</FieldLabel
                      ><Input
                        v-model="variant.sku"
                        required
                        placeholder="SKU varian"
                      /><FieldError>{{
                        messageFor(`variants.${index}.sku`)
                      }}</FieldError></Field
                    >
                    <Field
                      ><FieldLabel>Nama / opsi varian</FieldLabel
                      ><Input
                        v-model="variant.name"
                        placeholder="Contoh: 250 gram"
                    /></Field>
                    <Field :data-invalid="!!variantBarcodeError(index)"
                      ><FieldLabel>Barcode (opsional)</FieldLabel
                      ><Input v-model="variant.barcode" :aria-invalid="!!variantBarcodeError(index)"
                    /><FieldError>{{ variantBarcodeError(index) }}</FieldError></Field>
                    <Field
                      ><FieldLabel>Biaya referensi / HPP awal</FieldLabel
                      ><MoneyInput
                        v-model="variant.cost"
                    /></Field>
                    <Field
                      ><FieldLabel>Harga jual dasar</FieldLabel
                      ><MoneyInput
                        v-model="variant.default_price"
                    /></Field>
                  </div>
                  <div v-if="variant.additional_units.length" class="space-y-3 rounded-md border bg-background p-3">
                    <div>
                      <p class="flex items-center gap-2 text-sm font-medium"><CircleDollarSign class="size-4 text-primary" />Harga dan barcode satuan tambahan</p>
                      <p class="text-xs text-muted-foreground">Nilai ini khusus untuk varian {{ index + 1 }}. Rasio konversi mengikuti definisi produk di atas.</p>
                    </div>
                    <div v-for="(extra, extraIndex) in variant.additional_units" :key="extraIndex" class="grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2">
                      <div class="flex items-center gap-2 text-sm font-medium"><Ruler class="size-4 text-muted-foreground" />{{ units.find((unit) => unit.id === extra.unit_id)?.name }} · 1 {{ units.find((unit) => unit.id === extra.unit_id)?.code }} = {{ extra.conversion_value }} {{ units.find((unit) => unit.id === variant.base_unit_id)?.code }}</div>
                      <Field><FieldLabel>HPP satuan ini</FieldLabel><MoneyInput v-model="extra.cost" /></Field>
                      <Field><FieldLabel>Harga jual satuan ini</FieldLabel><MoneyInput v-model="extra.default_price" /></Field>
                      <Field :data-invalid="!!additionalUnitBarcodeError(index, extraIndex)"><FieldLabel class="flex items-center gap-2"><Barcode class="size-4 text-muted-foreground" />Barcode (opsional)</FieldLabel><Input v-model="extra.barcode" :aria-invalid="!!additionalUnitBarcodeError(index, extraIndex)" /><FieldError>{{ additionalUnitBarcodeError(index, extraIndex) }}</FieldError></Field>
                    </div>
                  </div>
                  <div class="space-y-2 rounded-md border bg-background p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="flex items-center gap-2 text-sm font-medium"><Images class="size-4 text-primary" />Gambar varian</p>
                        <p class="text-xs text-muted-foreground">
                          Opsional, maksimal 5 gambar per varian.
                        </p>
                      </div>
                      <label
                        class="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                        >Tambah gambar<Input
                          type="file"
                          class="sr-only"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          :disabled="variant.images.length >= 5"
                          @change="onVariantImagesSelected($event, variant)"
                      /></label>
                    </div>
                    <div
                      v-if="variant.images.length"
                      class="grid grid-cols-5 gap-2"
                    >
                      <div
                        v-for="(image, imageIndex) in variant.images"
                        :key="image.preview"
                        class="relative aspect-square overflow-hidden rounded-md border"
                      >
                        <img
                          :src="image.preview"
                          :alt="image.file.name"
                          class="size-full object-cover"
                        /><button
                          type="button"
                          class="absolute right-1 top-1 rounded-full bg-background/90 px-1.5 text-sm"
                          aria-label="Hapus gambar varian"
                          @click="removeVariantDraftImage(variant, imageIndex)"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" @click="addVariant"
                  >Tambah varian</Button
                >
                <FieldError>{{ messageFor("variants") }}</FieldError>
              </template>
            </section>

            <section class="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
              <div>
                <h2 class="flex items-center gap-2 font-semibold"><ShieldCheck class="size-4 text-primary" />Pajak dan persediaan</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  Tentukan perlakuan pajak dan pelacakan stok untuk transaksi.
                </p>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex items-center gap-3">
                  <Switch
                    id="track-stock"
                    v-model="form.track_stock"
                    :disabled="form.type === 'service'"
                  /><FieldLabel for="track-stock"
                    >Kelola stok{{
                      form.type === "service"
                        ? " (jasa tidak menyimpan stok)"
                        : ""
                    }}</FieldLabel
                  >
                </div>
                <Field v-if="form.track_stock"
                  ><FieldLabel for="min-stock">Batas minimum stok</FieldLabel
                  ><Input
                    id="min-stock"
                    v-model.number="form.min_stock"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                  /><FieldError>{{
                    messageFor("min_stock")
                  }}</FieldError></Field
                >
                <div class="flex items-center gap-3">
                  <Switch id="taxable" v-model="form.is_taxable" /><FieldLabel
                    for="taxable"
                    >Produk dikenakan pajak</FieldLabel
                  >
                </div>
                <Field
                  v-if="form.is_taxable"
                  :data-invalid="!!messageFor('tax_rate')"
                  ><FieldLabel for="tax-rate">Tarif pajak (%)</FieldLabel
                  ><Input
                    id="tax-rate"
                    v-model.number="form.tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    placeholder="11"
                  /><FieldError>{{ messageFor("tax_rate") }}</FieldError></Field
                >
                <Field
                  ><FieldLabel for="weight"
                    >Berat per satuan dasar (opsional)</FieldLabel
                  ><Input
                    id="weight"
                    v-model.number="form.weight"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                  /><FieldError>{{ messageFor("weight") }}</FieldError></Field
                >
                <div v-if="isEdit" class="flex items-center gap-3">
                  <Switch
                    id="product-active"
                    v-model="form.is_active"
                  /><FieldLabel for="product-active">Produk aktif</FieldLabel>
                </div>
              </div>
            </section>
            <section
              v-if="isEdit && activeVariants.length"
              class="space-y-3 rounded-lg border p-4"
            >
              <div>
                <h3 class="flex items-center gap-2 font-medium"><Layers class="size-4 text-primary" />Varian tersimpan</h3>
                <p class="text-sm text-muted-foreground">
                  Varian yang dinonaktifkan tidak dapat dipilih untuk transaksi
                  baru.
                </p>
              </div>
              <div
                v-for="variant in activeVariants"
                :key="variant.id"
                class="space-y-3 rounded-md bg-muted/30 p-3"
              >
                <div>
                  <p class="font-medium">
                    {{ variant.sku
                    }}<span v-if="variant.name"> · {{ variant.name }}</span>
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{
                      variant.units
                        ?.map(
                          (item) =>
                            `${item.unit.code}${item.is_base ? " (dasar)" : ` × ${item.conversion_value}`}`,
                        )
                        .join(", ")
                    }}
                    · Harga dasar
                    {{
                      new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(
                        Number(
                          variant.units.find((item) => item.is_base)
                            ?.default_price ?? 0,
                        ),
                      )
                    }}
                  </p>
                </div>
                <Button
                  v-if="activeVariants.length > 1 && can('product.delete')"
                  type="button"
                  size="sm"
                  variant="outline"
                  :disabled="branchBusy"
                  @click="deactivateVariant(variant.id)"
                  >Nonaktifkan varian</Button
                >
                <div class="space-y-2 rounded-md border bg-background p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p class="flex items-center gap-2 text-sm font-medium"><Ruler class="size-4 text-primary" />Satuan dan konversi produk</p>
                      <p class="text-xs text-muted-foreground">Konversi diatur sekali dan berlaku sama untuk semua varian produk.</p>
                    </div>
                    <Button v-if="variant.is_default && can('product.create') && !unitDrafts[variant.id]" type="button" size="sm" variant="outline" @click="startAddingVariantUnit(variant.id)">Tambah satuan produk</Button>
                  </div>
                  <div v-for="variantUnit in variant.units" :key="variantUnit.id" class="grid gap-2 rounded-md bg-muted/30 p-3 sm:grid-cols-[minmax(100px,1fr)_minmax(180px,1.5fr)_auto] sm:items-center">
                    <div><p class="text-sm font-medium">{{ variantUnit.unit.name }} <span class="text-muted-foreground">({{ variantUnit.unit.code }})</span></p><p class="text-xs text-muted-foreground">{{ variantUnit.is_base ? 'Satuan dasar' : 'Satuan tambahan' }}</p></div>
                    <div v-if="variantUnit.is_base" class="text-sm text-muted-foreground">1 {{ variantUnit.unit.code }} = 1 {{ variantUnit.unit.code }}</div>
                    <Field v-else-if="variant.is_default">
                      <FieldLabel class="sr-only">Jumlah {{ variantUnit.unit.code }} dalam satuan dasar</FieldLabel>
                      <div class="flex items-center gap-2"><span class="shrink-0 text-sm">1 {{ variantUnit.unit.code }} =</span><Input v-model.number="variantUnit.conversion_value" type="number" min="0.0001" step="any" class="max-w-28"/><span class="text-sm">{{ baseUnitCode(variant) }}</span></div>
                    </Field>
                    <div v-else class="text-sm text-muted-foreground">1 {{ variantUnit.unit.code }} = {{ variantUnit.conversion_value }} {{ baseUnitCode(variant) }} (bersama untuk semua varian)</div>
                    <div v-if="variantUnit.is_base" class="text-xs text-muted-foreground">Konversi dasar selalu 1.</div>
                    <div v-else-if="variant.is_default" class="flex gap-2"><Button v-if="can('product.update')" type="button" size="sm" variant="outline" :disabled="savingUnit || Number(variantUnit.conversion_value) <= 0" @click="updateSavedVariantUnit(variantUnit)">Simpan</Button><Button v-if="can('product.delete')" type="button" size="sm" variant="ghost" class="text-destructive" :disabled="savingUnit" @click="deleteSavedVariantUnit(variantUnit.id)">Hapus</Button></div>
                  </div>
                  <div v-if="variant.is_default && unitDrafts[variant.id]" class="grid gap-3 rounded-md border border-dashed p-3 sm:grid-cols-2 xl:grid-cols-[minmax(150px,1fr)_minmax(190px,1.2fr)_minmax(110px,.7fr)_minmax(120px,.8fr)_auto] sm:items-end">
                    <Field><FieldLabel>Satuan tambahan</FieldLabel><ComboboxSelect v-model="unitDrafts[variant.id].unit_id" :options="units.filter((unit) => !variant.units.some((item) => item.unit.id === unit.id) && !variant.units.some((item) => item.is_base && item.unit.id === unit.id)).map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))" placeholder="Pilih satuan" search-placeholder="Cari satuan..." /></Field>
                    <Field><FieldLabel>Konversi ke satuan dasar</FieldLabel><div class="flex items-center gap-2"><span class="shrink-0 text-sm">1 {{ units.find((unit) => unit.id === unitDrafts[variant.id].unit_id)?.code || 'satuan' }} =</span><Input v-model.number="unitDrafts[variant.id].conversion_value" type="number" min="0.0001" step="any"/><span class="text-sm">{{ baseUnitCode(variant) }}</span></div></Field>
                    <Field><FieldLabel>Biaya referensi</FieldLabel><MoneyInput v-model="unitDrafts[variant.id].cost" /></Field>
                    <Field><FieldLabel>Harga jual</FieldLabel><MoneyInput v-model="unitDrafts[variant.id].default_price" /></Field>
                    <div class="flex gap-2"><Button type="button" size="sm" :disabled="savingUnit || unitDrafts[variant.id].unit_id === '' || Number(unitDrafts[variant.id].conversion_value) <= 0" @click="saveVariantUnit(variant.id)"><Spinner v-if="savingUnit"/>Simpan</Button><Button type="button" size="sm" variant="outline" :disabled="savingUnit" @click="cancelAddingVariantUnit(variant.id)">Batal</Button></div>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <div
                    v-for="image in variant.images || []"
                    :key="image.id"
                    class="group relative size-16 overflow-hidden rounded-md border"
                  >
                    <img
                      :src="image.url"
                      :alt="image.original_name || 'Gambar varian'"
                      class="size-full object-cover"
                    /><button
                      v-if="can('product.update')"
                      type="button"
                      class="absolute right-0 top-0 bg-background/90 px-1 text-xs opacity-0 group-hover:opacity-100"
                      :aria-label="`Hapus ${image.original_name || 'gambar varian'}`"
                      @click="removeSavedVariantImage(variant.id, image.id)"
                    >
                      ×
                    </button>
                  </div>
                  <label
                    v-if="
                      can('product.update') && (variant.images?.length || 0) < 5
                    "
                    class="flex size-16 cursor-pointer items-center justify-center rounded-md border border-dashed text-xl text-muted-foreground hover:bg-background"
                    :aria-label="`Tambah gambar untuk ${variant.sku}`"
                    >+<Input
                      type="file"
                      class="sr-only"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      @change="
                        onSavedVariantImageSelected($event, variant.id)
                      " /></label
                  ><span
                    v-if="!variant.images?.length"
                    class="text-xs text-muted-foreground"
                    >Belum ada gambar khusus varian.</span
                  >
                </div>
              </div>
            </section>
            <section
              v-if="isEdit && inactiveVariants.length"
              class="space-y-3 rounded-lg border border-dashed p-4"
            >
              <div>
                <h3 class="flex items-center gap-2 font-medium"><Layers class="size-4 text-muted-foreground" />Varian nonaktif</h3>
                <p class="text-sm text-muted-foreground">
                  Varian ini tidak tersedia untuk transaksi baru. Aktifkan kembali kapan saja.
                </p>
              </div>
              <div
                v-for="variant in inactiveVariants"
                :key="variant.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/30 p-3"
              >
                <div>
                  <p class="font-medium">{{ variant.sku }}<span v-if="variant.name"> · {{ variant.name }}</span></p>
                  <p class="text-xs text-muted-foreground">Nonaktif · tidak ditawarkan pada transaksi baru</p>
                </div>
                <Button
                  v-if="can('product.update')"
                  type="button"
                  size="sm"
                  variant="outline"
                  :disabled="branchBusy"
                  @click="reactivateVariant(variant.id)"
                >Aktifkan kembali</Button>
              </div>
            </section>
            <section
              v-if="isEdit && form.type === 'product' && can('product.create')"
              class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed p-4"
            >
              <div class="space-y-1">
                <h3 class="flex items-center gap-2 font-medium"><Tag class="size-4 text-primary" />Tambah varian</h3>
                <p class="text-sm text-muted-foreground">
                  Tambahkan pilihan varian tanpa memperpanjang formulir produk.
                </p>
              </div>
              <Button type="button" variant="outline" @click="addVariantDialogOpen = true">Tambah varian</Button>
            </section>
            <Dialog v-model:open="addVariantDialogOpen">
              <DialogContent class="w-[calc(100vw-2rem)] max-h-[90dvh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle class="flex items-center gap-2"><Tag class="size-4 text-primary" />Tambah varian</DialogTitle>
                  <DialogDescription>
                    Tambahkan SKU, barcode, HPP, dan harga awal. Satuan dasar dan konversi mengikuti produk.
                  </DialogDescription>
                </DialogHeader>
              <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                <Field :data-invalid="!!messageFor('sku')"
                  ><FieldLabel>SKU</FieldLabel
                  ><Input
                    v-model="newVariantDraft.sku"
                    :aria-invalid="!!messageFor('sku')"
                    placeholder="SKU varian"
                  /><FieldError>{{ messageFor("sku") }}</FieldError></Field
                >
                <Field
                  ><FieldLabel>Nama / opsi varian</FieldLabel
                  ><Input
                    v-model="newVariantDraft.name"
                    placeholder="Contoh: 500 gram"
                /></Field>
                <Field :data-invalid="!!messageFor('base_unit_id')"
                  ><FieldLabel>Satuan dasar produk (bersama)</FieldLabel
                  ><div class="flex h-10 items-center text-sm text-muted-foreground">{{ managedProduct?.units?.find((unit) => unit.is_base)?.unit.name || "Belum dikonfigurasi" }} (bersama untuk semua varian)</div><FieldError>{{ messageFor("base_unit_id") }}</FieldError></Field>
                <Field :data-invalid="!!(messageFor('barcode') || messageFor('variants.0.barcode'))"
                  ><FieldLabel>Barcode (opsional)</FieldLabel
                  ><Input v-model="newVariantDraft.barcode" :aria-invalid="!!(messageFor('barcode') || messageFor('variants.0.barcode'))"
                /><FieldError>{{ messageFor('barcode') || messageFor('variants.0.barcode') }}</FieldError></Field>
                <Field
                  ><FieldLabel>Biaya referensi / HPP awal</FieldLabel
                    ><MoneyInput
                      v-model="newVariantDraft.cost"
                  /></Field>
                <Field
                  ><FieldLabel>Harga jual dasar</FieldLabel
                    ><MoneyInput
                      v-model="newVariantDraft.default_price"
                  /></Field>
              </div>
              <div class="min-w-0 space-y-3 rounded-md border bg-background p-3">
                <div class="flex items-center justify-between gap-3"><div><p class="flex items-center gap-2 text-sm font-medium"><CircleDollarSign class="size-4 text-primary" />Harga dan barcode satuan tambahan</p><p class="text-xs text-muted-foreground">Rasio konversi produk sama untuk semua varian; harga dan barcode pada varian baru ini dapat diatur terpisah.</p></div></div>
                <div v-for="(extra, extraIndex) in newVariantDraft.additional_units" :key="extraIndex" class="grid min-w-0 gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2">
                  <div class="min-w-0 break-words text-sm font-medium">{{ units.find((unit) => unit.id === extra.unit_id)?.name || "Satuan" }} ({{ units.find((unit) => unit.id === extra.unit_id)?.code }})</div>
                  <div class="min-w-0 break-words text-sm text-muted-foreground">1 {{ units.find((unit) => unit.id === extra.unit_id)?.code }} = {{ extra.conversion_value }} {{ units.find((unit) => unit.id === newVariantDraft.base_unit_id)?.code }}</div>
                  <Field><FieldLabel>Harga jual satuan</FieldLabel><MoneyInput v-model="extra.default_price" /></Field>
                  <Field><FieldLabel class="flex items-center gap-2"><Barcode class="size-4 text-muted-foreground" />Barcode (opsional)</FieldLabel><Input v-model="extra.barcode" /></Field>
                </div>
              </div>
              <div class="min-w-0 space-y-2 rounded-md border bg-muted/20 p-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="flex items-center gap-2 text-sm font-medium"><Images class="size-4 text-primary" />Gambar varian</p>
                    <p class="text-xs text-muted-foreground">
                      Maksimal 5 gambar, JPG/PNG/WEBP hingga 5 MB.
                    </p>
                  </div>
                  <label
                    class="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                    >Tambah gambar<Input
                      type="file"
                      class="sr-only"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      :disabled="newVariantDraft.images.length >= 5"
                      @change="
                        onVariantImagesSelected($event, newVariantDraft)
                      "
                  /></label>
                </div>
                <div
                  v-if="newVariantDraft.images.length"
                  class="grid grid-cols-2 gap-2 sm:grid-cols-5"
                >
                  <div
                    v-for="(image, imageIndex) in newVariantDraft.images"
                    :key="image.preview"
                    class="relative aspect-square overflow-hidden rounded-md border"
                  >
                    <img
                      :src="image.preview"
                      :alt="image.file.name"
                      class="size-full object-cover"
                    /><button
                      type="button"
                      class="absolute right-1 top-1 rounded-full bg-background/90 px-1.5 text-sm"
                      aria-label="Hapus gambar varian"
                      @click="
                        removeVariantDraftImage(newVariantDraft, imageIndex)
                      "
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
                <DialogFooter>
                  <Button type="button" variant="outline" :disabled="addingVariant" @click="addVariantDialogOpen = false">Batal</Button>
                  <Button
                    type="button"
                    :disabled="
                      addingVariant ||
                      !newVariantDraft.sku.trim() ||
                      !newVariantDraft.base_unit_id
                    "
                    @click="submitNewVariant"
                    ><Spinner v-if="addingVariant" />{{
                      addingVariant ? "Menambahkan…" : "Simpan varian"
                    }}</Button
                  >
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <section
              v-if="isEdit && activeVariants.length && form.type === 'product'"
              class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div class="space-y-1">
                <h3 class="flex items-center gap-2 font-medium"><CircleDollarSign class="size-4 text-primary" />Harga bertingkat</h3>
                <p class="text-sm text-muted-foreground">
                  Lihat dan kelola harga grosir berdasarkan kuantitas, daftar harga, atau cabang.
                </p>
              </div>
              <Button type="button" variant="outline" @click="priceTierDialogOpen = true">Kelola harga bertingkat</Button>
            </section>
            <Dialog v-model:open="priceTierDialogOpen">
              <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle class="flex items-center gap-2"><CircleDollarSign class="size-4 text-primary" />Harga bertingkat</DialogTitle>
                  <DialogDescription>
                    Atur harga grosir berdasarkan kuantitas minimum, daftar harga, atau cabang.
                  </DialogDescription>
                </DialogHeader>
              <div class="grid gap-3 sm:grid-cols-3">
                <Field
                  ><FieldLabel>Daftar harga (opsional)</FieldLabel
                  ><ComboboxSelect
                    v-model="priceListForTier"
                    :options="[
                      { value: '', label: 'Harga umum' },
                      ...priceLists.map((list) => ({
                        value: list.id,
                        label: `${list.name}${list.is_default ? ' (default)' : ''}`,
                      })),
                    ]"
                    placeholder="Pilih daftar harga"
                    search-placeholder="Cari daftar harga..."
                /></Field>
                <Field
                  ><FieldLabel>Cabang khusus (opsional)</FieldLabel
                  ><ComboboxSelect
                    v-model="tierBranch"
                    :options="[
                      { value: '', label: 'Semua cabang' },
                      ...branches.map((branch) => ({
                        value: branch.id,
                        label: branch.name,
                      })),
                    ]"
                    placeholder="Semua cabang"
                    search-placeholder="Cari cabang..."
                /></Field>
                <Field
                  ><FieldLabel>Mode harga</FieldLabel
                  ><ComboboxSelect
                    v-model="tierMode"
                    :options="[
                      { value: 'fixed', label: 'Harga tetap' },
                      { value: 'margin', label: 'Persentase margin' },
                      { value: 'follow_center', label: 'Ikuti harga pusat' },
                    ]"
                    placeholder="Pilih mode harga"
                /></Field>
                <Field
                  ><FieldLabel>Minimum kuantitas</FieldLabel
                  ><Input
                    v-model.number="tierQuantity"
                    type="number"
                    min="1.0001"
                    step="any"
                /></Field>
                <Field
                  ><FieldLabel>{{
                    tierMode === "margin" ? "Margin (%)" : "Harga"
                  }}</FieldLabel
                  ><MoneyInput
                    v-if="tierMode !== 'margin'"
                    v-model="tierPrice"
                /><Input
                    v-else
                    v-model.number="tierPrice"
                    type="number"
                    min="0"
                    step="0.01"
                /></Field>
              </div>
              <div
                v-if="can('product.create')"
                class="flex flex-col gap-2 rounded-md bg-muted/40 p-3 sm:flex-row sm:items-end"
              >
                <Field class="flex-1"
                  ><FieldLabel>Daftar harga baru (opsional)</FieldLabel
                  ><Input
                    v-model="priceListName"
                    placeholder="Contoh: Harga Grosir" /></Field
                ><Button
                  type="button"
                  variant="outline"
                  :disabled="priceListBusy"
                  @click="createPriceList"
                  ><Spinner v-if="priceListBusy" />Buat daftar harga</Button
                >
              </div>
              <div
                v-for="variant in activeVariants"
                :key="variant.id"
                class="space-y-2 rounded-md bg-muted/30 p-3"
              >
                <h4 class="flex items-center gap-2 text-sm font-medium">
                  <Tag class="size-4 text-primary" />
                  {{ variant.sku
                  }}<span v-if="variant.name"> · {{ variant.name }}</span>
                </h4>
                <div
                  v-for="variantUnit in variant.units"
                  :key="variantUnit.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <div class="space-y-1">
                    <span class="font-medium"
                      >{{ variantUnit.unit.name }} ({{
                        variantUnit.unit.code
                      }})</span
                    >
                    <div
                      v-if="variantUnit.prices?.length"
                      class="flex flex-wrap gap-2 text-muted-foreground"
                    >
                      <span
                        v-for="price in variantUnit.prices"
                        :key="price.id"
                        class="inline-flex items-center gap-1 rounded bg-muted px-2 py-1"
                        >min. {{ price.min_qty }}:
                        {{
                          new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(Number(price.price))
                        }}<Button
                          v-if="can('product.delete')"
                          type="button"
                          variant="ghost"
                          size="sm"
                          class="h-5 px-1 text-destructive"
                          :disabled="priceBusy"
                          :aria-label="`Hapus harga tier ${price.id}`"
                          @click="removePriceTier(variantUnit.id, price.id)"
                          >×</Button
                        ></span
                      >
                    </div>
                    <span v-else class="text-muted-foreground"
                      >Belum ada harga bertingkat</span
                    >
                  </div>
                  <Button
                    v-if="can('product.create')"
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="priceBusy"
                    @click="addPriceTier(variantUnit.id)"
                    ><Spinner v-if="priceBusy" />Tambah tier</Button
                  >
                </div>
              </div>
                <DialogFooter>
                  <Button type="button" variant="outline" @click="priceTierDialogOpen = false">Tutup</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <section
              v-if="
                isEdit &&
                activeVariants.length &&
                branches.length &&
                can('product.update')
              "
              class="space-y-4 rounded-lg border p-4"
            >
              <div>
                <h3 class="flex items-center gap-2 font-medium"><Store class="size-4 text-primary" />Ketersediaan per cabang</h3>
                <p class="text-sm text-muted-foreground">
                  Override ini membuat varian tersedia atau tidak tersedia pada
                  cabang terpilih. Pilih “Ikuti assortment” untuk menghapus
                  override.
                </p>
              </div>
              <Field class="max-w-sm"
                ><FieldLabel>Cabang</FieldLabel
                ><ComboboxSelect
                  v-model="branchForAllocation"
                  :options="
                    branches.map((branch) => ({
                      value: branch.id,
                      label: branch.name,
                    }))
                  "
                  placeholder="Pilih cabang"
                  search-placeholder="Cari cabang..."
              /></Field>
              <div
                v-for="variant in activeVariants"
                :key="variant.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/30 p-3"
              >
                <div>
                  <p class="font-medium">
                    {{ variant.sku
                    }}<span v-if="variant.name"> · {{ variant.name }}</span>
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ variant.is_default ? "Varian default" : "Varian" }}
                  </p>
                  <span v-if="branchForAllocation !== '' && !branchAvailabilityLoading && branchAvailability[variant.id]" class="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="branchAvailability[variant.id].is_available ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'">{{ branchAvailability[variant.id].is_available ? (branchAvailability[variant.id].override_type === 'include' ? 'Tersedia · override' : 'Tersedia · assortment') : (branchAvailability[variant.id].override_type === 'exclude' ? 'Override · tidak tersedia' : 'Tidak masuk assortment') }}</span>
                  <span v-else-if="branchAvailabilityLoading" class="mt-1 block text-xs text-muted-foreground">Memuat status cabang…</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    :variant="branchAvailability[variant.id]?.override_type === 'include' ? 'default' : 'outline'"
                    :disabled="branchBusy || branchAvailabilityLoading || branchForAllocation === ''"
                    @click="setBranchAvailability(variant.id, 'include')"
                    >Tersedia</Button
                  ><Button
                    type="button"
                    size="sm"
                    :variant="branchAvailability[variant.id]?.override_type === 'exclude' ? 'destructive' : 'outline'"
                    :disabled="branchBusy || branchAvailabilityLoading || branchForAllocation === '' || !branchAvailability[variant.id]?.override_type"
                    @click="setBranchAvailability(variant.id, 'exclude')"
                    >Tidak tersedia</Button
                  ><Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    :disabled="branchBusy || branchAvailabilityLoading || branchForAllocation === ''"
                    @click="setBranchAvailability(variant.id, 'inherit')"
                    >Ikuti assortment</Button
                  >
                </div>
              </div>
            </section>
          </template>
        </FieldGroup>
        <aside class="space-y-5">
          <section class="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
            <div>
              <h2 class="flex items-center gap-2 font-semibold"><Images class="size-4 text-primary" />Gambar produk</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Tambahkan hingga lima gambar. Format JPG, PNG, WEBP, maksimal 5
                MB per gambar.
              </p>
            </div>
            <Field
              :data-invalid="!!imageError || !!messageFor('images')"
              class="gap-2"
            >
              <label
                for="product-images"
                class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center transition hover:border-primary/50 hover:bg-primary/5"
                :class="imageCount >= 5 ? 'cursor-not-allowed opacity-60' : ''"
              >
                <span
                  class="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-xl text-primary"
                  >＋</span
                >
                <span class="font-medium">Pilih gambar</span
                ><span class="mt-1 text-xs text-muted-foreground"
                  >{{ imageCount }} dari 5 gambar</span
                >
                <Input
                  id="product-images"
                  class="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  :disabled="imageCount >= 5"
                  @change="onImagesSelected"
                />
              </label>
              <FieldError>{{ imageError || imageServerError }}</FieldError>
            </Field>
            <div v-if="imageCount" class="grid grid-cols-2 gap-3">
              <div
                v-for="image in existingImages"
                :key="`existing-${image.id}`"
                class="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <img
                  :src="image.url"
                  :alt="image.original_name || 'Gambar produk'"
                  class="size-full object-cover"
                  loading="lazy"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="absolute right-2 top-2 size-7 opacity-90"
                  :aria-label="`Hapus ${image.original_name || 'gambar produk'}`"
                  @click="removeExistingImage(image)"
                  >×</Button
                >
              </div>
              <div
                v-for="(image, index) in selectedImages"
                :key="`selected-${image.preview}`"
                class="relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <img
                  :src="image.preview"
                  :alt="image.file.name"
                  class="size-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  class="absolute right-2 top-2 size-7 opacity-90"
                  :aria-label="`Hapus ${image.file.name}`"
                  @click="removeSelectedImage(index)"
                  >×</Button
                >
                <span
                  class="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs text-white"
                  >{{ image.file.name }}</span
                >
              </div>
            </div>
            <p v-else class="text-center text-xs text-muted-foreground">
              Gambar membantu pelanggan mengenali produk di katalog.
            </p>
          </section>
          <section
            class="rounded-xl border bg-muted/20 p-5 text-sm text-muted-foreground"
          >
            <h2 class="flex items-center gap-2 font-medium text-foreground"><ShieldCheck class="size-4 text-primary" />Sebelum menyimpan</h2>
            <ul class="mt-3 list-inside list-disc space-y-2">
              <li>Pastikan nama dan SKU mudah dikenali.</li>
              <li>Harga dasar disimpan per satuan varian.</li>
              <li>Saldo awal dicatat dari menu Penyesuaian Stok.</li>
              <li>Tarif pajak menjadi nilai default transaksi berikutnya.</li>
            </ul>
          </section>
        </aside>
      </div>
      <div
        class="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-background/95 py-4 backdrop-blur"
      >
        <Button
          type="button"
          variant="outline"
          :disabled="loading"
          @click="router.push({ name: 'products.index' })"
          >Batal</Button
        >
        <Button
          type="submit"
          :disabled="loading || lookupsLoading || pageLoading"
          ><Spinner v-if="loading" />{{
            loading
              ? "Menyimpan…"
              : isEdit
                ? "Simpan perubahan"
                : "Simpan produk"
          }}</Button
        >
      </div>
    </form>
  </main>
</template>
