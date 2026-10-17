import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Profile {
  id: string
  email: string
  full_name: string | null
  business_name: string | null
  plan: 'free' | 'pro'
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  description: string
  quantity: number
  unit_price: number
  position: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  currency: string
  tax_rate: number
  notes: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'id' | 'name' | 'email' | 'address'> | null
  invoice_items?: InvoiceItem[]
}

export const FREE_INVOICE_LIMIT = 3
