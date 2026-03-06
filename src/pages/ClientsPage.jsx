import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, addClient, updateClient, deleteClient } from '../services/api'
import Modal from '../components/Modal'
import { useLanguage } from '../LanguageContext'

const emptyForm = { name: '', phone: '', notes: '' }

export default function ClientsPage() {
  const { t } = useLanguage()
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

  function openAdd() { setEditClient(null); setForm(emptyForm); setError(''); setShowModal(true) }
  function openEdit(client) { setEditClient(client); setForm({ name: client.name, phone: client.phone || '', notes: client.notes || '' }); setError(''); setShowModal(true) }

  async function handleSave() {
    if (!form.name.trim()) { setError(t.nameRequired); return }
    setSaving(true); setError('')
    const { error } = editClient ? await updateClient(editClient.id, form) : await addClient(form)
    if (error) { setError(error.message); setSaving(false); return }
    setSaving(false); setShowModal(false); load()
  }

  async function handleDelete(id) { await deleteClient(id); setConfirmDelete(null); load() }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  )

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.clients}</h1>
          <p className="page-subtitle">{clients.length} {t.clientsSubtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ {t.addClient}</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input placeholder={t.searchClients} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Mobile card view */}
      <div className="mobile-cards">
        {filtered.map(client => (
          <div key={client.id} className="mobile-card" onClick={() => navigate(`/clients/${client.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 15 }}>{client.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(client.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>{client.phone || '—'}</div>
            <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${client.id}`)}>{t.details}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(client)}>{t.edit}</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(client)}>{t.delete}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="desktop-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t.clientName}</th><th>{t.clientPhone}</th><th>{t.clientNotes}</th>
                <th>{t.registeredDate}</th><th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="icon">◈</div><p>{search ? t.noResults : t.noData}</p></div></td></tr>
              ) : filtered.map(client => (
                <tr key={client.id}>
                  <td style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/clients/${client.id}`)}>{client.name}</td>
                  <td>{client.phone || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>{client.notes || <span style={{ color: 'var(--text-3)' }}>—</span>}</span></td>
                  <td>{new Date(client.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${client.id}`)}>{t.details}</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(client)}>{t.edit}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(client)}>{t.delete}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editClient ? t.editClient : t.addClient} onClose={() => setShowModal(false)} footer={
          <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t.saving : (editClient ? t.saveChanges : t.addClient)}</button></>
        }>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label>{t.clientName} *</label><input placeholder={t.namePlaceholder} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
            <div className="form-group"><label>{t.clientPhone}</label><input placeholder={t.phonePlaceholder} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="form-group"><label>{t.notes}</label><textarea placeholder={t.notesPlaceholder} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title={t.deleteClient} onClose={() => setConfirmDelete(null)} footer={
          <><button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>{t.cancel}</button>
            <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete.id)}>{t.delete}</button></>
        }>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>{t.deleteClientConfirm} <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong>؟ {t.deleteClientWarn}</p>
        </Modal>
      )}
    </div>
  )
}
