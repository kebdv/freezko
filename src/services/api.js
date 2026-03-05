import { supabase } from '../supabaseClient'

// ==================== CLIENTS ====================
export async function getClients() {
  const { data, error } = await supabase
    .from('clients').select('*').order('name')
  return { data, error }
}

export async function addClient(client) {
  const { data, error } = await supabase
    .from('clients').insert([client]).select().single()
  return { data, error }
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients').update(updates).eq('id', id).select().single()
  return { data, error }
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  return { error }
}

export async function getClientTransactions(clientId, filters = {}) {
  let query = supabase
    .from('storage_operations')
    .select('*, batches(code), products(name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (filters.product_id) query = query.eq('product_id', filters.product_id)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')

  const { data, error } = await query
  return { data, error }
}

// ==================== PRODUCTS ====================
export async function getProducts() {
  const { data, error } = await supabase
    .from('products').select('*').order('name')
  return { data, error }
}

// ==================== BATCHES ====================
export async function getBatches() {
  const { data, error } = await supabase
    .from('batches')
    .select('*, clients(name), products(name)')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getBatchByCode(code) {
  const { data, error } = await supabase
    .from('batches')
    .select('*, clients(name), products(name)')
    .eq('code', code.toUpperCase())
    .single()
  return { data, error }
}

export async function getBatchHistory(batchId) {
  const { data, error } = await supabase
    .from('storage_operations')
    .select('*, clients(name), products(name)')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getClientActiveBatches(clientId) {
  const { data, error } = await supabase
    .from('batches')
    .select('*, products(name)')
    .eq('client_id', clientId)
    .in('status', ['ACTIVE', 'PARTIAL'])
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createBatch(batchData) {
  const { data: { user } } = await supabase.auth.getUser()

  // Generate batch code via DB function
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_batch_code')
  if (codeError) return { error: codeError }

  const code = codeData

  // Insert batch
  const { data: batch, error: batchError } = await supabase
    .from('batches')
    .insert([{
      code,
      client_id: batchData.client_id,
      product_id: batchData.product_id,
      quantity_original: batchData.quantity,
      quantity_remaining: batchData.quantity,
      unit: batchData.unit,
      status: 'ACTIVE',
      user_id: user.id,
    }])
    .select('*, clients(name), products(name)')
    .single()

  if (batchError) return { error: batchError }

  // Insert IN operation
  await supabase.from('storage_operations').insert([{
    batch_id: batch.id,
    client_id: batchData.client_id,
    product_id: batchData.product_id,
    quantity: batchData.quantity,
    unit: batchData.unit,
    type: 'IN',
    notes: batchData.notes || null,
    user_id: user.id,
  }])

  return { data: batch, error: null }
}

export async function processBatchOut({ batchId, quantity, notes }) {
  const { data: { user } } = await supabase.auth.getUser()

  // Get current batch
  const { data: batch, error: fetchError } = await supabase
    .from('batches')
    .select('*, clients(name), products(name)')
    .eq('id', batchId)
    .single()

  if (fetchError) return { error: fetchError }
  if (batch.quantity_remaining < quantity) {
    return { error: { message: 'الكمية المطلوبة أكبر من المتاح' } }
  }

  const newRemaining = batch.quantity_remaining - quantity
  const newStatus = newRemaining === 0 ? 'CLOSED' : 'PARTIAL'

  // Update batch
  const { error: updateError } = await supabase
    .from('batches')
    .update({ quantity_remaining: newRemaining, status: newStatus })
    .eq('id', batchId)

  if (updateError) return { error: updateError }

  // Insert OUT operation
  await supabase.from('storage_operations').insert([{
    batch_id: batchId,
    client_id: batch.client_id,
    product_id: batch.product_id,
    quantity,
    unit: batch.unit,
    type: 'OUT',
    notes: notes || null,
    user_id: user.id,
  }])

  return { data: { ...batch, quantity_remaining: newRemaining, status: newStatus }, error: null }
}

// ==================== OPERATIONS ====================
export async function getOperations() {
  const { data, error } = await supabase
    .from('storage_operations')
    .select('*, clients(name), products(name), batches(code)')
    .order('created_at', { ascending: false })
    .limit(100)
  return { data, error }
}

// ==================== INVENTORY ====================
export async function getInventory() {
  const { data, error } = await supabase
    .from('batches')
    .select('*, clients(id, name), products(id, name)')
    .in('status', ['ACTIVE', 'PARTIAL'])
    .order('created_at', { ascending: false })
  return { data, error }
}

// ==================== DASHBOARD ====================
export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const [clientsRes, batchesRes, todayOpsRes, activeBatchesRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('batches').select('quantity_remaining, unit'),
    supabase.from('storage_operations').select('id', { count: 'exact' }).gte('created_at', todayISO),
    supabase.from('batches').select('id', { count: 'exact' }).in('status', ['ACTIVE', 'PARTIAL']),
  ])

  const totalKg = batchesRes.data?.reduce((s, b) => {
    const qty = b.unit === 'TON' ? b.quantity_remaining * 1000 : b.quantity_remaining
    return s + qty
  }, 0) || 0

  return {
    totalClients: clientsRes.count || 0,
    totalInventoryKg: totalKg,
    todayOps: todayOpsRes.count || 0,
    activeBatches: activeBatchesRes.count || 0,
  }
}
