<script setup lang="ts">
import { nextTick, ref, watch } from "vue"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

const props = withDefaults(defineProps<{
  modelValue: number | string | null
  disabled?: boolean
  placeholder?: string
  class?: string
}>(), {
  disabled: false,
  placeholder: "0",
})

const emit = defineEmits<{
  "update:modelValue": [value: number | ""] 
}>()

const display = ref("")
const editing = ref(false)
const displayFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 })

function format(value: number | string | null) {
  if (value === "" || value === null) return ""
  const amount = Number(value)
  return Number.isFinite(amount) ? displayFormat.format(amount) : ""
}

function normalizeInput(value: string): { displayValue: string; numericValue: number | "" } {
  const normalized = value.replace(/^Rp\s*/i, "").replace(/[^\d,.-]/g, "")
  if (!/\d/.test(normalized)) {
    return { displayValue: normalized.includes(",") ? "," : "", numericValue: "" }
  }
  const commaIndex = normalized.lastIndexOf(",")
  const dotIndex = normalized.lastIndexOf(".")
  const decimalIndex = commaIndex >= 0
    ? commaIndex
    : dotIndex >= 0 && normalized.slice(dotIndex + 1).length <= 2
      ? dotIndex
      : -1
  const integerPart = (decimalIndex >= 0 ? normalized.slice(0, decimalIndex) : normalized)
    .replace(/[.,]/g, "")
  const fractionPart = decimalIndex >= 0
    ? normalized.slice(decimalIndex + 1).replace(/[.,]/g, "")
    : ""
  const groupedInteger = integerPart
    ? Number(integerPart).toLocaleString("id-ID", { maximumFractionDigits: 0 })
    : ""
  const hasDecimalSeparator = decimalIndex >= 0
  const displayValue = `${groupedInteger}${hasDecimalSeparator ? `,${fractionPart}` : ""}`
  const parsedValue = Number(`${integerPart || "0"}${hasDecimalSeparator ? `.${fractionPart || "0"}` : ""}`)

  return {
    displayValue,
    numericValue: Number.isFinite(parsedValue) ? parsedValue : "",
  }
}

function onInput(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const caret = input.selectionStart ?? input.value.length
  const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length
  const rawValue = input.value.replace(/^Rp\s*/i, "").replace(/[^\d,.-]/g, "")
  const commaIndex = rawValue.lastIndexOf(",")
  const dotIndex = rawValue.lastIndexOf(".")
  const decimalIndex = commaIndex >= 0
    ? commaIndex
    : dotIndex >= 0 && rawValue.slice(dotIndex + 1).length <= 2
      ? dotIndex
      : -1
  const prefixLength = input.value.length - rawValue.length
  const caretAfterDecimal = decimalIndex >= 0 && caret - prefixLength > decimalIndex
  const fractionDigitsBeforeCaret = caretAfterDecimal
    ? rawValue.slice(decimalIndex + 1, caret - prefixLength).replace(/\D/g, "").length
    : 0
  const { displayValue, numericValue } = normalizeInput(input.value)
  display.value = displayValue
  emit("update:modelValue", numericValue)

  nextTick(() => {
    const updatedInput = input
    let nextCaret = displayValue.length
    if (caretAfterDecimal) {
      const outputDecimalIndex = displayValue.indexOf(",")
      if (outputDecimalIndex >= 0) {
        nextCaret = Math.min(displayValue.length, outputDecimalIndex + 1 + fractionDigitsBeforeCaret)
      }
    } else {
      nextCaret = 0
      let digitCount = 0
      while (nextCaret < displayValue.length && digitCount < digitsBeforeCaret) {
        const character = displayValue[nextCaret]
        if (character && /\d/.test(character)) digitCount += 1
        nextCaret += 1
      }
    }
    updatedInput.setSelectionRange(nextCaret, nextCaret)
  })
}

function onFocus() {
  editing.value = true
  display.value = format(props.modelValue)
}

function onBlur() {
  editing.value = false
  display.value = format(props.modelValue)
}

watch(
  () => props.modelValue,
  value => {
    if (!editing.value) display.value = format(value)
  },
  { immediate: true },
)
</script>

<template>
  <InputGroup :class="props.class">
    <InputGroupAddon><span>Rp</span></InputGroupAddon>
    <InputGroupInput
      :model-value="display"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
  </InputGroup>
</template>
