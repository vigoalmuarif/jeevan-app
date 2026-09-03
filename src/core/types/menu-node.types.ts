export interface MenuNode {
  key: string
  label: string
  icon?: string
  routeName?: string        // null = parent group (tidak navigable)
  module?: string           // key module yang harus aktif
  permission?: string       // permission yang harus dimiliki
  children?: MenuNode[]
  order?: number
}