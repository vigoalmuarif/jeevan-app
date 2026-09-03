<script setup lang="ts" generic="TData">
import { ref } from "vue";
import type { Table } from "@tanstack/vue-table";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Calendar02Icon } from "@hugeicons/core-free-icons";
import { computed } from "vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { useColorMode } from "@vueuse/core";
import { Label } from "./ui/label";
import { Field, FieldLabel } from "./ui/field";

const props = withDefaults(
  defineProps<{
    table: Table<TData>;
    multiCalendars?: boolean;
    for: string;
    showlabel?: boolean;
    filter: {
      id: string;
      label: string;
      type: "date";
    };
  }>(),
  {
    multiCalendars: true,
    showlabel: false,
    for: "date-range",
  },
);

const mode = useColorMode();

const isDark = computed(() => mode.value === "dark");
const dates = computed({
  get() {
    const filterVal = props.table
      .getColumn(props.filter.id)
      ?.getFilterValue() as { start: string; end: string } | undefined;

    return filterVal ? [filterVal.start, filterVal.end] : [];
  },
  set(val: string[]) {
    if (!val || val.length === 0) {
      return props.table.getColumn(props.filter.id)?.setFilterValue(undefined);
    }

    props.table.getColumn(props.filter.id)?.setFilterValue({
      start: val[0] ?? null,
      end: val[1] ?? null,
    });
  },
});
</script>

<template>
  <Field>
    <FieldLabel :for="for" :class="showlabel ? '' : ' sr-only'"
      >{{ filter.label }}</FieldLabel
    >
    <VueDatePicker
      v-model="dates"
      range
      :transitions="true"
      :dark="isDark"
      :multi-calendars="multiCalendars"
      :time-config="{ enableTimePicker: false }"
      model-type="yyyy-MM-dd"
    >
      <template #dp-input="{ value }">
        <InputGroup>
          <InputGroupInput
            :id="for"
            :value="value"
            placeholder="Pilih tanggal"
          />
          <InputGroupAddon>
            <HugeiconsIcon :icon="Calendar02Icon" />
          </InputGroupAddon>
        </InputGroup>
      </template>
    </VueDatePicker>
  </Field>
</template>

<style>
.dp__theme_dark {
  --dp-background-color: #212121;
  --dp-text-color: #fff;
  --dp-hover-color: #3cdbab83;
  --dp-hover-text-color: #fff;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #1dad76;
  --dp-primary-disabled-color: #61a8ea;
  --dp-primary-text-color: #fff;
  --dp-secondary-color: #a9a9a9;
  --dp-border-color: #2d2d2d;
  --dp-menu-border-color: #2d2d2d;
  --dp-border-color-hover: #aaaeb7;
  --dp-border-color-focus: #aaaeb7;
  --dp-disabled-color: #737373;
  --dp-disabled-color-text: #d0d0d0;
  --dp-scroll-bar-background: #212121;
  --dp-scroll-bar-color: #484848;
  --dp-success-color: #00701a;
  --dp-success-color-disabled: #428f59;
  --dp-icon-color: #959595;
  --dp-danger-color: #e53935;
  --dp-marker-color: #e53935;
  --dp-tooltip-color: #3e3e3e;
  --dp-highlight-color: rgb(0 92 178 / 20%);
  --dp-range-between-dates-background-color: var(--dp-hover-color, #484848);
  --dp-range-between-dates-text-color: var(--dp-hover-text-color, #fff);
  --dp-range-between-border-color: var(--dp-hover-color, #fff);
}

.dp--theme-light {
  --dp-background-color: #fff;
  --dp-text-color: #212121;
  --dp-hover-color: #5ee0965b;
  --dp-hover-text-color: #212121;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #1c916a;
  --dp-primary-disabled-color: #78c4a4;
  --dp-primary-text-color: #f8f5f5;
  --dp-secondary-color: #c0c4cc;
  --dp-border-color: #ddd;
  --dp-menu-border-color: #ddd;
  --dp-border-color-hover: #aaaeb7;
  --dp-border-color-focus: #aaaeb7;
  --dp-disabled-color: #f6f6f6;
  --dp-scroll-bar-background: #f3f3f3;
  --dp-scroll-bar-color: #959595;
  --dp-success-color: #76d275;
  --dp-success-color-disabled: #a3d9b1;
  --dp-icon-color: #959595;
  --dp-danger-color: #ff6f60;
  --dp-marker-color: #ff6f60;
  --dp-tooltip-color: #fafafa;
  --dp-disabled-color-text: #8e8e8e;
  --dp-highlight-color: rgb(25 118 210 / 10%);
  --dp-range-between-dates-background-color: var(--dp-hover-color, #f3f3f3);
  --dp-range-between-dates-text-color: var(--dp-hover-text-color, #212121);
  --dp-range-between-border-color: var(--dp-hover-color, #f3f3f3);
}
</style>
