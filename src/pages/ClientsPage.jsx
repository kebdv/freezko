import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, addClient, updateClient, deleteClient } from '../services/api'
import Modal from '../components/Modal'

const emptyForm = { name: '', phone: '', notes: '' }

export default function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    const { data } = await getClients()
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditClient(null); setForm(emptyForm); setError(''); setShowModal(true)
  }

  function openEdit(client) {
    setEditClient(client)
    setForm({ name: client.name, phone: client.phone || '', notes: client.notes || '' })
    setError(''); setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('الاسم مطلوب'); return }
    setSaving(true); setError('')
    const fn = editClient ? updateClient(editClient.id, form) : addClient(form)
    const { error } = await fn
    if (error) { setError(error.message); setSaving(false); return }
    setSaving(false); setShowModal(false); load()
  }

  async function handleDelete(id) {
    await deleteClient(id); setConfirmDelete(null); load()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">العملاء</h1>
          <p className="page-subtitle">{clients.length} عميل مسجل</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة عميل</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>ملاحظات</th>
              <th>تاريخ التسجيل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><div className="icon">◈</div><p>{search ? 'لا نتائج' : 'لا يوجد عملاء بعد'}</p></div></td></tr>
            ) : filtered.map(client => (
              <tr key={client.id} style={{ cursor: 'pointer' }}>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <span style={{ color: 'var(--accent)' }}>{client.name}</span>
                </td>
                <td onClick={() => navigate(`/clients/${client.id}`)}>{client.phone || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                <td onClick={() => navigate(`/clients/${client.id}`)}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>
                    {client.notes || <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </span>
                </td>
                <td onClick={() => navigate(`/clients/${client.id}`)}>
                  {new Date(client.created_at).toLocaleDateString('ar-EG')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${client.id}`)}>تفاصيل</button>
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); openEdit(client) }}>تعديل</button>
                    <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); setConfirmDelete(client) }}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editClient ? 'تعديل عميل' : 'إضافة عميل'} onClose={() => setShowModal(false)} footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : (editClient ? 'حفظ التغييرات' : 'إضافة')}
            </button>
          </>
        }>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label>الاسم *</label><input placeholder="اسم العميل" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div className="form-group"><label>الهاتف</label><input placeholder="+20 xxx xxx xxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label>ملاحظات</label><textarea placeholder="ملاحظات إضافية..." rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="حذف عميل" onClose={() => setConfirmDelete(null)} footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>إلغاء</button>
            <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>حذف</button>
          </>
        }>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            هل تريد حذف <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong>؟ لا يمكن التراجع.
          </p>
        </Modal>
      )}
    </div>
  )
}
