import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Alert } from "./Alert.vue"
export { default as AlertAction } from "./AlertAction.vue"
export { default as AlertDescription } from "./AlertDescription.vue"
export { default as AlertTitle } from "./AlertTitle.vue"

export const alertVariants = cva('grid gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*=size-])]:size-4 group/alert relative w-full', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      success: 'text-green-600 border-green-500 bg-card *:data-[slot=alert-description]:text-green-600/90 *:[svg]:text-current',
      info: 'text-sky-600 border-sky-500 bg-card *:data-[slot=alert-description]:text-sky-600/90 *:[svg]:text-current',
      warning: 'text-amber-600 border-amber-500 bg-card *:data-[slot=alert-description]:text-amber-600/90 *:[svg]:text-current',
      destructive: 'text-destructive border-destructive/90 bg-destructive/10 *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type AlertVariants = VariantProps<typeof alertVariants>
