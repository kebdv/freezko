import { supabase } from '../supabaseClient'

// Clients
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  return { data, error }
}

export async function addClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single()
  return { data, error }
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  return { error }
}

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  return { data, error }
}

// Operations
export async function getOperations() {
  const { data, error } = await supabase
    .from('storage_operations')
    .select(`
      *,
      clients (name),
      products (name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  return { data, error }
}

export async function addOperation(operation) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('storage_operations')
    .insert([{ ...operation, user_id: user.id }])
    .select()
    .single()
  return { data, error }
}

// Inventory (aggregated)
export async function getInventory() {
  const { data, error } = await supabase
    .from('storage_operations')
    .select(`
      type,
      quantity,
      clients (id, name),
      products (id, name)
    `)
  return { data, error }
}

// Dashboard stats
export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const [clientsRes, opsRes, todayOpsRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('storage_operations').select('quantity, type'),
    supabase.from('storage_operations').select('id', { count: 'exact' }).gte('created_at', todayISO),
  ])

  const totalIn = opsRes.data?.filter(o => o.type === 'IN').reduce((s, o) => s + o.quantity, 0) || 0
  const totalOut = opsRes.data?.filter(o => o.type === 'OUT').reduce((s, o) => s + o.quantity, 0) || 0

  return {
    totalClients: clientsRes.count || 0,
    totalInventory: totalIn - totalOut,
    todayOps: todayOpsRes.count || 0,
    totalIn,
    totalOut,
  }
}
