export interface Category {
  id: number
  name: string
  description: string
}

export type UserRole = 'user' | 'company' | 'admin'

export interface Role {
  id: number
  name: UserRole
  description: string
}

export interface User {
  id: string
  email: string | null
  full_name: string | null
  is_active: boolean
  role: Role
  created_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Company {
  id: number
  name: string
  description: string
  logo_url: string | null
  active: boolean
  categories?: Category[]
  product_count?: number
  min_price?: number
}

export interface Product {
  id: number
  company_id: number
  name: string
  description: string | null
  price: string
  stock: number
  image_url: string | null
  active: boolean
  category?: Category | null
}

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  unit_price: string
}

export interface Order {
  id: number
  buyer_id: string
  company_id: number
  total: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  order_items?: OrderItem[]
}

export interface Balance {
  id: string
  user_id: string
  amount: string
  updated_at: string
}

export interface BalanceTransaction {
  id: number
  user_id: string
  order_id: number
  amount: string
  type: 'personal' | 'company'
  created_at: string
}

export interface CartItem {
  product_id: number
  company_id: number
  name: string
  price: number
  quantity: number
  company_name: string
  image_url?: string | null
}

export interface ApiError {
  detail?: string
  error?: string
  details?: { field: string; message: string; type: string }[]
}
