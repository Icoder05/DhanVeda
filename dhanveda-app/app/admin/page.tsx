'use client'
import { useState, useEffect, useMemo } from 'react'
import { signOut } from 'next-auth/react'

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  investorType: string
  isAdmin: boolean
  esgEnabled: boolean
  suspended: boolean
  oauthProvider: string | null
  createdAt: string
  termsAccepted: boolean
  termsAcceptedAt: string | null
  termsVersion: string | null
}

interface UserTableRow {
  userId: string
  name: string
  tokensUsed: number
  investorType: string
  recentActions: string
  lastActivity: string | null
}

interface FeedbackItem {
  id: number
  userId: string | null
  userName: string | null
  userEmail: string | null
  category: string
  title: string
  description: string
  status: 'Open' | 'In Progress' | 'Resolved'
  adminNote: string | null
  createdAt: string
  updatedAt: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INVESTOR_TYPES = [
  'Retail Investor', 'HNI (High Net Worth)', 'Active Trader',
  'Long-term Investor', 'ESG-Focused Investor',
]

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Open':        { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'In Progress': { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Resolved':    { bg: 'rgba(16,185,129,0.1)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
}

const CAT_COLORS: Record<string, string> = {
  'Bug':             '#f87171',
  'Feature Request': '#34d399',
  'General':         '#a5b4fc',
}

// ── Small reusable helpers ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['Open']
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#10b981' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s', opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'users' | 'feedback' | 'activity' | 'contacts'>('overview')

  // Data
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activity, setActivity] = useState<any[]>([])       // used by Activity tab (raw feed)
  const [overviewActivity, setOverviewActivity] = useState<any[]>([]) // used by Overview panels
  const [contactsList, setContactsList] = useState<any[]>([])
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [userTableData, setUserTableData] = useState<UserTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Overview range filter
  const [overviewDays, setOverviewDays] = useState<'1' | '7' | '30' | 'all'>('30')
  const [overviewLoading, setOverviewLoading] = useState(false)

  // Archive stats
  const [archiveStats, setArchiveStats] = useState<{ rawLogCount: number; oldestLog: string | null; lastArchived: string | null } | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveMsg, setArchiveMsg] = useState('')

  // Users tab local state
  const [userSearch, setUserSearch] = useState('')
  const [userUpdating, setUserUpdating] = useState<string | null>(null)

  // Feedback tab local state
  const [fbFilter, setFbFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All')
  const [fbNotes, setFbNotes] = useState<Record<number, string>>({})
  const [fbStatuses, setFbStatuses] = useState<Record<number, string>>({})
  const [fbSaving, setFbSaving] = useState<number | null>(null)

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        // Run migrations first so columns/tables exist
        await fetch('/api/admin/migrate-tokens', { method: 'POST' }).catch(() => {})

        const [u, a, c, fb, ut, stats] = await Promise.all([
          fetch('/api/admin/users').then(r => r.json()),
          fetch('/api/admin/activity?days=all').then(r => r.json()),   // Activity tab: raw feed
          fetch('/api/admin/contacts').then(r => r.json()),
          fetch('/api/admin/feedback').then(r => r.json()),
          fetch('/api/admin/user-table?days=30').then(r => r.json()),  // Overview: 30-day default
          fetch('/api/admin/aggregate').then(r => r.json()),
        ])
        if (u.error) {
          setError('Not authorized. Please sign in as admin.')
          return
        }
        setUsers(Array.isArray(u) ? u : [])
        setActivity(Array.isArray(a) ? a : [])
        setContactsList(Array.isArray(c) ? c : [])
        const fbArr: FeedbackItem[] = Array.isArray(fb) ? fb : []
        setFeedbackList(fbArr)
        const initNotes: Record<number, string> = {}
        const initStatuses: Record<number, string> = {}
        fbArr.forEach(f => { initNotes[f.id] = f.adminNote ?? ''; initStatuses[f.id] = f.status })
        setFbNotes(initNotes)
        setFbStatuses(initStatuses)
        setUserTableData(Array.isArray(ut) ? ut : [])
        if (!stats.error) setArchiveStats(stats)

        // Seed overviewActivity from the 30-day window of the full activity set
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
        setOverviewActivity((Array.isArray(a) ? a : []).filter((x: any) => new Date(x.createdAt).getTime() >= cutoff))
      } catch {
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Re-fetch overview data when range filter changes ─────────────────────────

  async function fetchOverview(days: '1' | '7' | '30' | 'all') {
    setOverviewLoading(true)
    try {
      const [a, ut] = await Promise.all([
        fetch(`/api/admin/activity?days=${days}`).then(r => r.json()),
        fetch(`/api/admin/user-table?days=${days}`).then(r => r.json()),
      ])
      setOverviewActivity(Array.isArray(a) ? a : [])
      setUserTableData(Array.isArray(ut) ? ut : [])
    } finally {
      setOverviewLoading(false)
    }
  }

  function handleRangeChange(days: '1' | '7' | '30' | 'all') {
    setOverviewDays(days)
    fetchOverview(days)
  }

  // ── Archive old logs ─────────────────────────────────────────────────────────

  async function runArchive() {
    setArchiving(true)
    setArchiveMsg('')
    try {
      const res = await fetch('/api/admin/aggregate', { method: 'POST' })
      const data = await res.json()
      setArchiveMsg(data.message ?? 'Done.')
      // Refresh archive stats
      const stats = await fetch('/api/admin/aggregate').then(r => r.json())
      if (!stats.error) setArchiveStats(stats)
    } catch {
      setArchiveMsg('Archive failed. Try again.')
    } finally {
      setArchiving(false)
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────────

  const featureCounts: Record<string, number> = overviewActivity.reduce((acc: Record<string, number>, a) => {
    acc[a.feature] = (acc[a.feature] ?? 0) + 1; return acc
  }, {})

  const topStocks: [string, number][] = (Object.entries(
    overviewActivity.filter(a => a.stock).reduce((acc: Record<string, number>, a) => {
      acc[a.stock] = (acc[a.stock] ?? 0) + 1; return acc
    }, {})
  ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase()
    if (!q) return users
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, userSearch])

  const filteredFeedback = useMemo(() => {
    if (fbFilter === 'All') return feedbackList
    return feedbackList.filter(f => f.status === fbFilter)
  }, [feedbackList, fbFilter])

  // ── User management actions ────────────────────────────────────────────────

  async function patchUser(id: string, patch: Record<string, unknown>) {
    setUserUpdating(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } as AdminUser : u))
      }
    } finally { setUserUpdating(null) }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return
    setUserUpdating(id)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    setUserUpdating(null)
  }

  // ── Feedback management actions ────────────────────────────────────────────

  async function saveFeedback(id: number) {
    setFbSaving(id)
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: fbStatuses[id], adminNote: fbNotes[id] || null }),
      })
      setFeedbackList(prev => prev.map(f => f.id === id ? { ...f, status: fbStatuses[id] as FeedbackItem['status'], adminNote: fbNotes[id] || null } : f))
    } finally { setFbSaving(null) }
  }

  // ── Error state ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f0a' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/admin/login" className="text-emerald-400 underline">Go to admin login</a>
        </div>
      </div>
    )
  }

  const TABS = [
    ['overview',  '📊 Overview'],
    ['users',     '👥 Users'],
    ['feedback',  '💬 Feedback'],
    ['activity',  '📈 Activity'],
    ['contacts',  '📬 Contacts'],
  ] as const

  const openCount = feedbackList.filter(f => f.status === 'Open').length

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#0a0f0a' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-serif text-2xl text-white">ArthaSift</div>
            <div className="text-xs text-white/30 mt-0.5">Admin Dashboard</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-white/40 hover:text-red-400 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative"
              style={{ background: tab === id ? 'rgba(5,150,105,0.15)' : 'transparent', color: tab === id ? '#10B981' : 'rgba(255,255,255,0.4)', border: tab === id ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent' }}>
              {label}
              {id === 'feedback' && openCount > 0 && (
                <span style={{ position: 'absolute', top: 3, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {openCount > 9 ? '9+' : openCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-16"><div className="text-white/30 text-sm">Loading…</div></div>}

        {/* ── OVERVIEW ── */}
        {!loading && tab === 'overview' && (
          <div className="space-y-4">

            {/* ── Range filter strip ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/30 font-semibold uppercase tracking-wider mr-1">Showing:</span>
              {([['1', 'Today'], ['7', 'Last 7 Days'], ['30', 'Last 30 Days'], ['all', 'All Time']] as const).map(([val, label]) => (
                <button key={val} onClick={() => handleRangeChange(val)}
                  disabled={overviewLoading}
                  style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    cursor: overviewLoading ? 'wait' : 'pointer', transition: 'all 0.15s',
                    background: overviewDays === val ? 'rgba(16,185,129,0.15)' : 'transparent',
                    border: overviewDays === val ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: overviewDays === val ? '#10b981' : 'rgba(255,255,255,0.4)',
                    opacity: overviewLoading ? 0.6 : 1,
                  }}
                >
                  {label}
                </button>
              ))}
              {overviewLoading && <span className="text-xs text-white/30 ml-2">Refreshing…</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                ['Total Users', users.length, '#10B981'],
                ['Open Tickets', openCount, '#ef4444'],
                ['Analyses', overviewActivity.filter(a => a.feature === 'analysis').length, '#1E6FA8'],
                ['Community Posts', overviewActivity.filter(a => a.feature === 'community-post').length, '#F59E0B'],
                ['Contact Messages', contactsList.length, '#94a3b8'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="rounded-xl p-4 text-center" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
                  <div className="text-2xl font-bold" style={{ color: color as string }}>{val}</div>
                  <div className="text-xs text-white/30 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Top Searched Stocks</div>
                {topStocks.length ? topStocks.map(([s, n], i) => (
                  <div key={s} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                    <span className="text-white/60">{i + 1}. {s}</span>
                    <span className="font-semibold text-yellow-400">{n} searches</span>
                  </div>
                )) : <p className="text-sm text-white/30">No searches yet.</p>}
              </div>
              <div className="rounded-xl p-4" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Feature Usage</div>
                {Object.entries(featureCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([feature, count]) => (
                  <div key={feature} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                    <span className="text-white/60">{feature}</span>
                    <span className="font-semibold text-blue-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── User Activity Table ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2e1e' }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40">User Activity</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e2e1e' }}>
                      {['User ID', 'Tokens Used', 'Investor Type', 'Recent Actions', 'Last Activity'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userTableData.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '20px 14px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                          No user data yet.
                        </td>
                      </tr>
                    )}
                    {userTableData.map((row, i) => (
                      <tr key={row.userId + i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Col 1: User ID */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: '#10b981', fontFamily: 'monospace', fontSize: 12 }}>
                            @{row.userId}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 1 }}>{row.name}</div>
                        </td>

                        {/* Col 2: Tokens Used */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', color: row.tokensUsed > 50000 ? '#f87171' : row.tokensUsed > 10000 ? '#fbbf24' : '#a5b4fc' }}>
                            {row.tokensUsed.toLocaleString('en-IN')}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 1 }}>tokens</div>
                        </td>

                        {/* Col 3: Investor Type */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                            background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)',
                          }}>
                            {row.investorType}
                          </span>
                        </td>

                        {/* Col 4: Recent Actions */}
                        <td style={{ padding: '11px 14px', maxWidth: 300 }}>
                          <div style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {row.recentActions}
                          </div>
                        </td>

                        {/* Col 5: Last Activity */}
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {row.lastActivity ? (
                            <>
                              <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                                {new Date(row.lastActivity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 1 }}>
                                {new Date(row.lastActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Archive & Storage panel ── */}
            <div className="rounded-xl p-4" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Log Storage & Archiving</div>
                  {archiveStats ? (
                    <div className="flex flex-wrap gap-5 text-sm">
                      <div>
                        <span className="text-white/30 text-xs">Raw logs in DB</span>
                        <div className="font-bold text-white mt-0.5">{archiveStats.rawLogCount.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Oldest log</span>
                        <div className="font-bold text-white mt-0.5">
                          {archiveStats.oldestLog ? new Date(archiveStats.oldestLog).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Last archived</span>
                        <div className="font-bold text-white mt-0.5">{archiveStats.lastArchived ?? 'Never'}</div>
                      </div>
                      <div>
                        <span className="text-white/30 text-xs">Retention policy</span>
                        <div className="font-bold text-white mt-0.5">90 days raw · ∞ daily summaries</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/30">Loading storage info…</p>
                  )}
                  {archiveMsg && (
                    <p className="text-xs mt-2" style={{ color: archiveMsg.includes('failed') ? '#f87171' : '#34d399' }}>{archiveMsg}</p>
                  )}
                </div>
                <button
                  onClick={runArchive}
                  disabled={archiving}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                    background: archiving ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24',
                    cursor: archiving ? 'not-allowed' : 'pointer', opacity: archiving ? 0.6 : 1,
                  }}
                >
                  {archiving ? 'Archiving…' : '⟳ Archive Logs >90 Days'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── USERS ── */}
        {!loading && tab === 'users' && (
          <div className="rounded-xl" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
            <div className="p-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid #1e2e1e' }}>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Registered Users ({filteredUsers.length}{userSearch ? ` of ${users.length}` : ''})
              </div>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2e1e', color: '#fff', fontSize: 12, outline: 'none', width: 220 }}
              />
            </div>

            {filteredUsers.length === 0 && (
              <p className="text-sm text-white/30 p-4">No users match your search.</p>
            )}

            {filteredUsers.map(u => (
              <div key={u.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Row top: avatar + info + badges */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: u.suspended ? 'rgba(239,68,68,0.15)' : 'rgba(5,150,105,0.15)', color: u.suspended ? '#f87171' : '#10B981' }}>
                    {(u.name ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{u.name}</span>
                      {u.isAdmin && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>ADMIN</span>}
                      {u.suspended && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>SUSPENDED</span>}
                      {u.oauthProvider && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{u.oauthProvider === 'google' ? 'Google' : 'Microsoft'}</span>}
                      {!u.termsAccepted && <span style={{ padding: '1px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>TERMS PENDING</span>}
                    </div>
                    <div className="text-xs text-white/30 mt-0.5">{u.email} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                  </div>
                </div>

                {/* Row controls */}
                <div className="flex items-center gap-4 mt-3 ml-12 flex-wrap">
                  {/* Investor type */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">Type</span>
                    <select
                      value={u.investorType ?? 'Retail Investor'}
                      disabled={userUpdating === u.id}
                      onChange={e => patchUser(u.id, { investorType: e.target.value })}
                      style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid #1e2e1e', color: '#fff', fontSize: 11, cursor: 'pointer' }}
                    >
                      {INVESTOR_TYPES.map(t => <option key={t} value={t} style={{ background: '#0e180e' }}>{t}</option>)}
                    </select>
                  </div>

                  {/* ESG toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/30">ESG</span>
                    <Toggle checked={u.esgEnabled ?? true} disabled={userUpdating === u.id} onChange={() => patchUser(u.id, { esgEnabled: !u.esgEnabled })} />
                  </div>

                  {/* Admin toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/30">Admin</span>
                    <Toggle checked={u.isAdmin ?? false} disabled={userUpdating === u.id} onChange={() => patchUser(u.id, { isAdmin: !u.isAdmin })} />
                  </div>

                  {/* Suspend toggle */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/30">Suspend</span>
                    <Toggle checked={u.suspended ?? false} disabled={userUpdating === u.id} onChange={() => patchUser(u.id, { suspended: !u.suspended })} />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    disabled={userUpdating === u.id}
                    style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, cursor: 'pointer', opacity: userUpdating === u.id ? 0.5 : 1 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {!loading && tab === 'feedback' && (
          <div className="space-y-3">
            {/* Filter strip */}
            <div className="flex gap-2">
              {(['All', 'Open', 'In Progress', 'Resolved'] as const).map(s => (
                <button key={s} onClick={() => setFbFilter(s)}
                  style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    background: fbFilter === s ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: fbFilter === s ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    color: fbFilter === s ? '#10b981' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {s} {s !== 'All' && <span style={{ opacity: 0.7 }}>({feedbackList.filter(f => f.status === s).length})</span>}
                </button>
              ))}
              <span className="text-xs text-white/30 ml-auto self-center">
                {filteredFeedback.length} item{filteredFeedback.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredFeedback.length === 0 && (
              <div className="rounded-xl p-8 text-center" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
                <p className="text-sm text-white/30">No feedback in this category yet.</p>
              </div>
            )}

            {filteredFeedback.map(f => (
              <div key={f.id} className="rounded-xl" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
                {/* Ticket header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[f.category] ?? '#a5b4fc', background: `${CAT_COLORS[f.category] ?? '#a5b4fc'}18`, padding: '1px 8px', borderRadius: 99, border: `1px solid ${CAT_COLORS[f.category] ?? '#a5b4fc'}30` }}>
                        {f.category === 'Bug' ? '🐛' : f.category === 'Feature Request' ? '✨' : '💬'} {f.category}
                      </span>
                      <StatusBadge status={fbStatuses[f.id] ?? f.status} />
                    </div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{f.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{f.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, margin: '0 0 2px' }}>{f.userName ?? '—'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: '0 0 2px' }}>{f.userEmail ?? ''}</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: 0 }}>
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>

                {/* Admin controls */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>Admin note</label>
                    <textarea
                      value={fbNotes[f.id] ?? ''}
                      onChange={e => setFbNotes(prev => ({ ...prev, [f.id]: e.target.value }))}
                      rows={2}
                      placeholder="Add internal note…"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
                    <select
                      value={fbStatuses[f.id] ?? f.status}
                      onChange={e => setFbStatuses(prev => ({ ...prev, [f.id]: e.target.value }))}
                      style={{ padding: '7px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                    >
                      <option value="Open" style={{ background: '#0e180e' }}>Open</option>
                      <option value="In Progress" style={{ background: '#0e180e' }}>In Progress</option>
                      <option value="Resolved" style={{ background: '#0e180e' }}>Resolved</option>
                    </select>
                  </div>
                  <button
                    onClick={() => saveFeedback(f.id)}
                    disabled={fbSaving === f.id}
                    style={{ padding: '8px 18px', borderRadius: 8, background: fbSaving === f.id ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 12, fontWeight: 600, cursor: fbSaving === f.id ? 'not-allowed' : 'pointer' }}
                  >
                    {fbSaving === f.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {!loading && tab === 'activity' && (
          <div className="rounded-xl p-4" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Recent Activity (last 50)</div>
            {activity.slice(0, 50).map(a => (
              <div key={a.id} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                <span className="text-white/60"><strong className="text-white/80">{a.userName ?? '?'}</strong> — {a.feature}{a.stock ? ` on ${a.stock}` : ''}</span>
                <span className="text-xs text-white/20">{a.createdAt ? new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── CONTACTS ── */}
        {!loading && tab === 'contacts' && (
          <div className="rounded-xl p-4" style={{ background: '#0e180e', border: '1px solid #1e2e1e' }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Contact Messages ({contactsList.length})</div>
            {contactsList.map(c => (
              <div key={c.id} className="py-4 border-b border-white/5 last:border-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{c.name}</span>
                  <span className="text-xs text-blue-400">{c.subject}</span>
                </div>
                <div className="text-xs text-white/30 mb-2">{c.email} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                <p className="text-sm text-white/50 leading-relaxed">{c.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
