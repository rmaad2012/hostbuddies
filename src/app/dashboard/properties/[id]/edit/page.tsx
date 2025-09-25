'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Pencil,
  Save,
  Eye,
  BookOpen,
  FileText,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  getPropertyByIdClient,
  updatePropertyClient,
  listKbDocsClient,
  addKbDocClient,
  updateKbDocClient,
  deleteKbDocClient,
  uploadGuidebookFile,
  type Property,
} from '@/lib/supabase-client'

type TabKey = 'ai' | 'kb' | 'guidebook'

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params?.id as string

  const [tab, setTab] = useState<TabKey>('ai')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [kbDocs, setKbDocs] = useState<any[]>([])

  // Editable fields
  const [name, setName] = useState('')
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [checkInInstructions, setCheckInInstructions] = useState('')
  const [trashDay, setTrashDay] = useState('')
  const [quietHours, setQuietHours] = useState('')
  const [personaStyle, setPersonaStyle] = useState<'friendly_guide' | 'foodie_pal' | 'trail_ranger'>('friendly_guide')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const p = await getPropertyByIdClient(propertyId)
      setProperty(p)
      if (p) {
        setName(p.name)
        // @ts-expect-error legacy optional fields
        setWifiName(p.wifi_name || '')
        // @ts-expect-error legacy optional fields
        setWifiPassword(p.wifi_password || '')
        // @ts-expect-error legacy optional fields
        setCheckInInstructions(p.check_in_instructions || '')
        // @ts-expect-error legacy optional fields
        setTrashDay(p.trash_day || '')
        // @ts-expect-error legacy optional fields
        setQuietHours(p.quiet_hours || '')
        // @ts-expect-error legacy optional fields
        setPersonaStyle(p.persona_style || 'friendly_guide')
      }
      const docs = await listKbDocsClient(propertyId)
      setKbDocs(docs)
      setLoading(false)
    }
    load()
  }, [propertyId])

  const handleSaveAI = async () => {
    setSaving(true)
    await updatePropertyClient(propertyId, {
      // @ts-expect-error writing optional fields
      wifi_name: wifiName,
      // @ts-expect-error writing optional fields
      wifi_password: wifiPassword,
      // @ts-expect-error writing optional fields
      check_in_instructions: checkInInstructions,
      // @ts-expect-error writing optional fields
      trash_day: trashDay,
      // @ts-expect-error writing optional fields
      quiet_hours: quietHours,
      // @ts-expect-error writing optional fields
      persona_style: personaStyle,
      name,
    })
    setSaving(false)
  }

  const handleAddKb = async (q: string, a: string) => {
    const created = await addKbDocClient(propertyId, q, a)
    if (created) setKbDocs((prev) => [...prev, created])
  }

  const handleUpdateKb = async (id: string, q: string, a: string) => {
    const updated = await updateKbDocClient(id, { question: q, answer: a })
    if (updated) setKbDocs((prev) => prev.map((d) => (d.id === id ? updated : d)))
  }

  const handleDeleteKb = async (id: string) => {
    const ok = await deleteKbDocClient(id)
    if (ok) setKbDocs((prev) => prev.filter((d) => d.id !== id))
  }

  const handleUploadGuidebook = async (file: File) => {
    const url = await uploadGuidebookFile(propertyId, file)
    if (url) {
      await updatePropertyClient(propertyId, { /* @ts-expect-error */ guidebook_url: url })
      setProperty((p) => (p ? ({ ...p, /* @ts-expect-error */ guidebook_url: url }) : p))
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-pulse text-gray-500">Loading property...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customize AI Host</h1>
          <p className="text-gray-600">Configure persona, FAQs, and guidebook for this property.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/guest/${propertyId}`}
            target="_blank"
            className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-gray-700"
          >
            <Eye className="w-4 h-4 mr-2" /> Preview Guest Chat
          </Link>
          <Link
            href="/guidebook"
            target="_blank"
            className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <BookOpen className="w-4 h-4 mr-2" /> View Sample Guidebook
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('ai')}
            className={`px-4 py-3 text-sm font-medium ${tab === 'ai' ? 'text-[#532de0] border-b-2 border-[#532de0]' : 'text-gray-600'}`}
          >
AI Host
          </button>
          <button
            onClick={() => setTab('kb')}
            className={`px-4 py-3 text-sm font-medium ${tab === 'kb' ? 'text-[#532de0] border-b-2 border-[#532de0]' : 'text-gray-600'}`}
          >
            <FileText className="inline w-4 h-4 mr-2" /> Knowledge Base
          </button>
          <button
            onClick={() => setTab('guidebook')}
            className={`px-4 py-3 text-sm font-medium ${tab === 'guidebook' ? 'text-[#532de0] border-b-2 border-[#532de0]' : 'text-gray-600'}`}
          >
            <BookOpen className="inline w-4 h-4 mr-2" /> Guidebook
          </button>
        </div>

        {/* Tab content */}
        {tab === 'ai' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Persona Style</label>
                <select
                  value={personaStyle}
                  onChange={(e) => setPersonaStyle(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="friendly_guide">😊 Friendly Guide</option>
                  <option value="foodie_pal">🍽️ Foodie Pal</option>
                  <option value="trail_ranger">🏔️ Trail Ranger</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Name</label>
                <input value={wifiName} onChange={(e) => setWifiName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password</label>
                <input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Instructions</label>
                <textarea value={checkInInstructions} onChange={(e) => setCheckInInstructions(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trash Day</label>
                <input value={trashDay} onChange={(e) => setTrashDay(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours</label>
                <input value={quietHours} onChange={(e) => setQuietHours(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveAI}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-[#532de0] hover:opacity-90 disabled:opacity-60"
              >
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'kb' && (
          <div className="p-6 space-y-6">
            {/* Add new QA */}
            <KbEditor onAdd={handleAddKb} />

            {/* List */}
            <div className="divide-y border rounded-lg">
              {kbDocs.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No knowledge base entries yet.</div>
              ) : (
                kbDocs.map((doc) => (
                  <KbRow key={doc.id} doc={doc} onSave={handleUpdateKb} onDelete={handleDeleteKb} />
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'guidebook' && (
          <div className="p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Upload Guidebook (PDF or DOCX)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUploadGuidebook(f)
              }}
              className="block"
            />
            {property && (property as any).guidebook_url && (
              <div className="text-sm">
                Current file: <a className="text-[#532de0] underline" href={(property as any).guidebook_url} target="_blank">Open</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KbEditor({ onAdd }: { onAdd: (q: string, a: string) => void }) {
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [adding, setAdding] = useState(false)
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
          <input value={a} onChange={(e) => setA(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={async () => {
            setAdding(true)
            await onAdd(q, a)
            setQ('')
            setA('')
            setAdding(false)
          }}
          disabled={adding || !q.trim() || !a.trim()}
          className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-60"
        >
          <Plus className="w-4 h-4 mr-2" /> {adding ? 'Adding...' : 'Add Q&A'}
        </button>
      </div>
    </div>
  )
}

function KbRow({ doc, onSave, onDelete }: { doc: any; onSave: (id: string, q: string, a: string) => void; onDelete: (id: string) => void }) {
  const [q, setQ] = useState(doc.question)
  const [a, setA] = useState(doc.answer)
  const [saving, setSaving] = useState(false)
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
      <input value={a} onChange={(e) => setA(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
      <div className="flex items-center gap-2">
        <button
          onClick={async () => { setSaving(true); await onSave(doc.id, q, a); setSaving(false) }}
          className="inline-flex items-center px-3 py-2 rounded-lg bg-[#532de0] text-white"
        >
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="inline-flex items-center px-3 py-2 rounded-lg border border-red-300 text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </button>
      </div>
    </div>
  )
}


