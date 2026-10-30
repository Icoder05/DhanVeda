'use client'
import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Post {
  id: number; userId: string; userName: string | null; topic: string | null; stock: string
  content: string; sentiment: string; category: string
  likeCount: number; commentCount: number; repostCount: number
  liked: boolean; createdAt: string; updatedAt: string | null
  repostOfId?: number | null; repostComment?: string | null
}
interface Comment {
  id: number; postId: number; userId: string; userName: string | null
  content: string; parentId?: number | null
  likeCount: number; liked: boolean; isOwn: boolean
  createdAt: string; updatedAt: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'stock',   label: '📈 Stock Analysis', placeholder: 'e.g. INFY, Tata Motors, Nifty 50' },
  { id: 'green',   label: '🌱 Green Finance',  placeholder: 'e.g. Solar ROI, REIT Yields, REC Market' },
  { id: 'venture', label: '🚀 Business & Venture', placeholder: 'e.g. SaaS startup, Franchise deal, Pitch idea' },
]
const SENTIMENTS = [
  { v: 'bullish', label: '🟢 Bullish', color: '#10B981' },
  { v: 'neutral', label: '🟡 Neutral', color: '#F59E0B' },
  { v: 'bearish', label: '🔴 Bearish', color: '#DC2626' },
]
const SENT_COLOR: Record<string, string> = { bullish: '#10B981', neutral: '#F59E0B', bearish: '#DC2626' }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Avatar({ name, size = 32 }: { name: string | null; size?: number }) {
  const ch = name?.charAt(0)?.toUpperCase() ?? '?'
  const hue = (ch.charCodeAt(0) * 37) % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},55%,45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {ch}
    </div>
  )
}

// ── Comment thread ─────────────────────────────────────────────────────────────
function CommentNode({ c, depth, currentUserId, onLike, onDelete, onEdit, onReply }:
  { c: Comment & { children?: Comment[] }; depth: number; currentUserId: string
    onLike: (id: number) => void; onDelete: (id: number) => void
    onEdit: (id: number, content: string) => void; onReply: (parentId: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.content)

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0, borderLeft: depth > 0 ? '2px solid rgba(5,150,105,0.15)' : 'none', paddingLeft: depth > 0 ? 12 : 0, marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
        <Avatar name={c.userName} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#064E3B' }}>{c.userName ?? 'User'}</span>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>{timeAgo(c.createdAt)}</span>
            {c.updatedAt && <span style={{ fontSize: 10, color: '#9CA3AF' }}>(edited)</span>}
          </div>
          {editing ? (
            <div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(5,150,105,0.3)', outline: 'none', resize: 'vertical', background: '#F0FDF4', color: '#064E3B' }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => { onEdit(c.id, editText); setEditing(false) }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditing(false)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <button onClick={() => onLike(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.liked ? '#059669' : '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: c.liked ? 700 : 400 }}>
              {c.liked ? '♥' : '♡'} {c.likeCount > 0 ? c.likeCount : ''}
            </button>
            {depth < 3 && (
              <button onClick={() => onReply(c.id)} style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>↩ Reply</button>
            )}
            {c.isOwn && (
              <>
                <button onClick={() => setEditing(true)} style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => onDelete(c.id)} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
      {c.children?.map(child => (
        <CommentNode key={child.id} c={child} depth={depth + 1} currentUserId={currentUserId}
          onLike={onLike} onDelete={onDelete} onEdit={onEdit} onReply={onReply} />
      ))}
    </div>
  )
}

// ── Post card ──────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onDelete, onEdit, onRepost }:
  { post: Post; currentUserId: string
    onLike: (id: number) => void; onDelete: (id: number) => void
    onEdit: (p: Post) => void; onRepost: (p: Post) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [posting, setPosting] = useState(false)
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount)

  const isOwn = post.userId === currentUserId
  const sc = SENT_COLOR[post.sentiment] ?? SENT_COLOR.neutral

  async function loadComments() {
    if (loadingComments) return
    setLoadingComments(true)
    const res = await fetch(`/api/community/comment?postId=${post.id}`)
    const data = await res.json()
    if (Array.isArray(data)) setComments(data)
    setLoadingComments(false)
  }

  function toggleComments() {
    if (!expanded && comments.length === 0) loadComments()
    setExpanded(v => !v)
  }

  async function submitComment() {
    if (!commentText.trim() || posting) return
    setPosting(true)
    const res = await fetch('/api/community/comment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, content: commentText.trim(), parentId: replyTo }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [...prev, c])
      setLocalCommentCount(prev => prev + 1)
      setCommentText(''); setReplyTo(null)
    }
    setPosting(false)
  }

  async function handleCommentLike(commentId: number) {
    const res = await fetch('/api/community/comment/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    })
    if (res.ok) {
      const { liked, likeCount } = await res.json()
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, liked, likeCount } : c))
    }
  }

  async function handleCommentDelete(commentId: number) {
    if (!confirm('Delete this comment?')) return
    const res = await fetch('/api/community/comment', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId }),
    })
    if (res.ok) { setComments(prev => prev.filter(c => c.id !== commentId)); setLocalCommentCount(prev => Math.max(0, prev - 1)) }
  }

  async function handleCommentEdit(commentId: number, content: string) {
    const res = await fetch('/api/community/comment', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId, content }),
    })
    if (res.ok) {
      const updated = await res.json()
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c))
    }
  }

  // build tree
  const roots = comments.filter(c => !c.parentId)
  const children: Record<number, Comment[]> = {}
  comments.filter(c => c.parentId).forEach(c => {
    const pid = c.parentId!
    if (!children[pid]) children[pid] = []
    children[pid].push(c)
  })
  function withChildren(c: Comment): Comment & { children?: Comment[] } {
    return { ...c, children: (children[c.id] ?? []).map(withChildren) }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.13)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      {/* Repost origin banner */}
      {post.repostOfId && (
        <div style={{ padding: '6px 16px', background: 'rgba(5,150,105,0.05)', borderBottom: '1px solid rgba(5,150,105,0.08)', fontSize: 11, color: '#6B7280' }}>
          🔁 Reshared post
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Avatar name={post.userName} size={34} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#064E3B' }}>{post.userName ?? 'User'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: '#064E3B', borderRadius: 4, padding: '1px 7px' }}>
                  {post.topic ?? post.stock}
                </span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{timeAgo(post.createdAt)}</span>
                {post.updatedAt && <span style={{ fontSize: 10, color: '#9CA3AF' }}>(edited)</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
              {post.sentiment}
            </span>
            {isOwn && (
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => onEdit(post)} title="Edit" style={{ fontSize: 13, background: 'rgba(5,150,105,0.08)', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', color: '#059669' }}>✏️</button>
                <button onClick={() => { if (confirm('Delete this post?')) onDelete(post.id) }} title="Delete" style={{ fontSize: 13, background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', color: '#DC2626' }}>🗑</button>
              </div>
            )}
          </div>
        </div>

        {/* Quoted repost content */}
        {post.repostComment && (
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontStyle: 'italic' }}>"{post.repostComment}"</div>
        )}

        {/* Content */}
        <p style={{ fontSize: 14, color: '#1F2937', lineHeight: 1.7, margin: 0 }}>{post.content}</p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
          <button onClick={() => onLike(post.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 8, border: `1px solid ${post.liked ? '#05966930' : 'rgba(5,150,105,0.12)'}`, background: post.liked ? 'rgba(5,150,105,0.08)' : 'transparent', color: post.liked ? '#059669' : '#6B7280', cursor: 'pointer', fontWeight: post.liked ? 700 : 400, transition: 'all 0.15s' }}>
            {post.liked ? '♥' : '♡'} {post.likeCount > 0 ? post.likeCount : 'Like'}
          </button>
          {!isOwn ? (
            <button onClick={toggleComments}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.12)', background: expanded ? 'rgba(5,150,105,0.06)' : 'transparent', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
              💬 {localCommentCount > 0 ? localCommentCount : 'Comment'}
            </button>
          ) : localCommentCount > 0 ? (
            <button onClick={toggleComments}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.12)', background: expanded ? 'rgba(5,150,105,0.06)' : 'transparent', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
              💬 {localCommentCount}
            </button>
          ) : null}
          <button onClick={() => onRepost(post)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(5,150,105,0.12)', background: 'transparent', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
            🔁 {post.repostCount > 0 ? post.repostCount : 'Repost'}
          </button>
        </div>
      </div>

      {/* Comments section */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(5,150,105,0.1)', padding: '12px 16px', background: '#FAFFFE' }}>
          {loadingComments ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>Loading…</p>
          ) : roots.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 10 }}>No comments yet. Be the first!</p>
          ) : (
            roots.map(c => (
              <CommentNode key={c.id} c={withChildren(c)} depth={0} currentUserId={currentUserId}
                onLike={handleCommentLike} onDelete={handleCommentDelete}
                onEdit={handleCommentEdit} onReply={(pid) => { setReplyTo(pid); setExpanded(true) }} />
            ))
          )}

          {/* Comment input — hidden for the post's own author */}
          {!isOwn && (
            <div style={{ marginTop: 12 }}>
              {replyTo && (
                <div style={{ fontSize: 11, color: '#059669', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ↩ Replying to comment
                  <button onClick={() => setReplyTo(null)} style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>✕ cancel</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                  placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', background: '#F0FDF4', color: '#064E3B' }} />
                <button onClick={submitComment} disabled={!commentText.trim() || posting}
                  style={{ padding: '8px 16px', borderRadius: 10, background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: (!commentText.trim() || posting) ? 0.4 : 1 }}>
                  {posting ? '…' : '→'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AI Insights panel ──────────────────────────────────────────────────────────
function AIInsights({ category, posts }: { category: string; posts: Post[] }) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? category

  async function synthesise() {
    if (posts.length < 2) { setResult({ _err: `Need at least 2 posts to synthesise insights.` }); return }
    setLoading(true); setResult(null)
    const summary = posts.slice(0, 30).map(p => `[${p.topic ?? p.stock}][${p.sentiment}]: "${p.content}"`).join('\n')
    const prompt = `You are ArthaSift's AI Advisor. Synthesise community posts from the "${catLabel}" channel (${posts.length} posts total):\n\n${summary}\n\nReply ONLY with valid JSON:\n{"total_posts":${posts.length},"dominant_sentiment":"bullish|neutral|bearish","key_topics":["topic1","topic2","topic3"],"consensus":"2 sentences on what the community broadly agrees on","contrarian":"1 sentence on the minority view","bias_detected":"FOMO|Confirmation Bias|Overconfidence|None","bias_explanation":"1 sentence","advisor_take":"2-3 sentences — balanced, educational, professional insight from the AI advisor"}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens: 700, feature: 'community-insight' }),
      })
      const data = await res.json()
      setResult(res.ok ? data : { _err: data.error })
    } catch (e: any) { setResult({ _err: e.message }) }
    setLoading(false)
  }

  const dominantColor = result?.dominant_sentiment ? SENT_COLOR[result.dominant_sentiment] ?? '#6B7280' : '#6B7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#022C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#064E3B' }}>ArthaSift AI Advisor</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Reads all posts in this channel · {posts.length} post{posts.length !== 1 ? 's' : ''} available</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>
          The AI Advisor reads every post in this channel cumulatively and gives you a synthesised view — consensus, contrarian angles, and bias detection. Not financial advice.
        </p>
        <button onClick={synthesise} disabled={loading || posts.length < 2}
          style={{ padding: '10px 20px', borderRadius: 10, background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: (loading || posts.length < 2) ? 0.5 : 1, width: '100%' }}>
          {loading ? 'Analysing community views…' : `Synthesise ${catLabel} insights →`}
        </button>
      </div>

      {result?._err && (
        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', fontSize: 13, color: '#92400E' }}>
          {result._err}
        </div>
      )}

      {result && !result._err && (
        <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#064E3B' }}>Community Synthesis</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${dominantColor}15`, color: dominantColor, border: `1px solid ${dominantColor}30` }}>
                {result.dominant_sentiment ?? '—'}
              </span>
              {result.bias_detected && result.bias_detected !== 'None' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.25)' }}>
                  ⚠ {result.bias_detected}
                </span>
              )}
            </div>
          </div>

          {result.key_topics?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.key_topics.map((t: string) => (
                <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.15)' }}>{t}</span>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Consensus</div>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{result.consensus}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>Community says</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{result.contrarian}</p>
            </div>
            {result.bias_detected !== 'None' && (
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Bias Alert</div>
                <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{result.bias_explanation}</p>
              </div>
            )}
          </div>
          <div style={{ padding: 14, borderRadius: 12, background: '#022C22', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              🤖 AI Advisor Take
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>{result.advisor_take}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '8px 0 0' }}>Educational only — not SEBI-registered advice.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const [category, setCategory] = useState<'stock' | 'green' | 'venture'>('stock')
  const [tab, setTab] = useState<'feed' | 'insights'>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')

  // post form
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [sentiment, setSentiment] = useState('neutral')
  const [submitting, setSubmitting] = useState(false)

  // edit modal
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [editTopic, setEditTopic] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editSentiment, setEditSentiment] = useState('neutral')
  const [saving, setSaving] = useState(false)

  // repost modal
  const [repostTarget, setRepostTarget] = useState<Post | null>(null)
  const [repostComment, setRepostComment] = useState('')
  const [reposting, setReposting] = useState(false)

  const cat = CATEGORIES.find(c => c.id === category)!

  // Read ?category= from URL on first load (e.g. when coming from Venture Community sidebar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlCat = params.get('category')
    if (urlCat === 'stock' || urlCat === 'green' || urlCat === 'venture') {
      setCategory(urlCat)
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => { if (s?.user?.id) setCurrentUserId(s.user.id) })
  }, [])

  useEffect(() => { loadFeed() }, [category])

  async function loadFeed() {
    setLoading(true)
    const res = await fetch(`/api/community?category=${category}`)
    const data = await res.json()
    if (Array.isArray(data)) setPosts(data)
    setLoading(false)
  }

  async function submitPost() {
    if (!content.trim() || !topic.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/community', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, topic, stock: topic, sentiment, category }),
    })
    if (res.ok) {
      const p = await res.json()
      setPosts(prev => [p, ...prev])
      setTopic(''); setContent(''); setSentiment('neutral')
    }
    setSubmitting(false)
  }

  async function handleLike(postId: number) {
    const res = await fetch('/api/community/like', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    if (res.ok) {
      const { liked, likeCount } = await res.json()
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked, likeCount } : p))
    }
  }

  async function handleDelete(postId: number) {
    const res = await fetch('/api/community', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId))
  }

  function openEdit(p: Post) { setEditPost(p); setEditTopic(p.topic ?? p.stock); setEditContent(p.content); setEditSentiment(p.sentiment) }

  async function saveEdit() {
    if (!editPost || !editContent.trim()) return
    setSaving(true)
    const res = await fetch('/api/community', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editPost.id, content: editContent, topic: editTopic, sentiment: editSentiment }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
      setEditPost(null)
    }
    setSaving(false)
  }

  async function submitRepost() {
    if (!repostTarget || !repostComment.trim()) return
    setReposting(true)
    const res = await fetch('/api/community', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: repostTarget.content, topic: repostTarget.topic ?? repostTarget.stock, stock: repostTarget.stock, sentiment: repostTarget.sentiment, category, repostOfId: repostTarget.id, repostComment }),
    })
    if (res.ok) {
      const p = await res.json()
      setPosts(prev => prev.map(existing => existing.id === repostTarget.id ? { ...existing, repostCount: existing.repostCount + 1 } : existing))
      setPosts(prev => [p, ...prev])
      setRepostTarget(null); setRepostComment('')
    }
    setReposting(false)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#064E3B', margin: '0 0 4px' }}>Community & Network</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Discuss ideas, share insights, network with fellow investors and entrepreneurs on ArthaSift.</p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 4, background: '#F0FDF4', borderRadius: 14, border: '1px solid rgba(5,150,105,0.12)' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => { setCategory(c.id as any); setTab('feed') }}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: category === c.id ? '#064E3B' : 'transparent',
              color: category === c.id ? '#fff' : '#6B7280' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Feed / Insights sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['feed', 'insights'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid rgba(5,150,105,0.2)', cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t ? 'rgba(5,150,105,0.1)' : 'transparent',
              color: tab === t ? '#059669' : '#6B7280' }}>
            {t === 'feed' ? '📰 Feed' : '🤖 AI Advisor'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {tab === 'feed' && (
        <>
          {/* Post composer */}
          <div style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#064E3B', marginBottom: 10 }}>Share your view</div>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={cat.placeholder}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', marginBottom: 8, background: '#F9FFFE', color: '#064E3B', boxSizing: 'border-box' }} />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's your take? Share analysis, questions, or insights…" rows={3} maxLength={600}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', resize: 'vertical', background: '#F9FFFE', color: '#064E3B', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {SENTIMENTS.map(s => (
                  <button key={s.v} onClick={() => setSentiment(s.v)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: `1px solid ${sentiment === s.v ? s.color : 'rgba(5,150,105,0.15)'}`, background: sentiment === s.v ? `${s.color}15` : 'transparent', color: sentiment === s.v ? s.color : '#9CA3AF', cursor: 'pointer', fontWeight: sentiment === s.v ? 700 : 400 }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{content.length}/600</span>
                <button onClick={submitPost} disabled={submitting || !content.trim() || !topic.trim()}
                  style={{ padding: '8px 20px', borderRadius: 10, background: '#059669', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: (submitting || !content.trim() || !topic.trim()) ? 0.4 : 1 }}>
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>Loading posts…</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No posts yet in {cat.label}</div>
              <div style={{ fontSize: 13 }}>Be the first to share your view!</div>
            </div>
          ) : (
            posts.map(p => (
              <PostCard key={p.id} post={p} currentUserId={currentUserId}
                onLike={handleLike} onDelete={handleDelete} onEdit={openEdit} onRepost={p => setRepostTarget(p)} />
            ))
          )}
        </>
      )}

      {tab === 'insights' && <AIInsights category={category} posts={posts} />}

      {/* ── Edit modal ── */}
      {editPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 520 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#064E3B', marginBottom: 16 }}>Edit post</div>
            <input value={editTopic} onChange={e => setEditTopic(e.target.value)} placeholder="Topic"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', marginBottom: 8, background: '#F9FFFE', color: '#064E3B', boxSizing: 'border-box' }} />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} maxLength={600}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', resize: 'vertical', background: '#F9FFFE', color: '#064E3B', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
              {SENTIMENTS.map(s => (
                <button key={s.v} onClick={() => setEditSentiment(s.v)}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: `1px solid ${editSentiment === s.v ? s.color : 'rgba(5,150,105,0.15)'}`, background: editSentiment === s.v ? `${s.color}15` : 'transparent', color: editSentiment === s.v ? s.color : '#9CA3AF', cursor: 'pointer', fontWeight: editSentiment === s.v ? 700 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditPost(null)} style={{ padding: '8px 16px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving || !editContent.trim()}
                style={{ padding: '8px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (saving || !editContent.trim()) ? 0.4 : 1 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Repost modal ── */}
      {repostTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 520 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#064E3B', marginBottom: 12 }}>🔁 Reshare with quote</div>
            {/* Original post preview */}
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(5,150,105,0.15)', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{repostTarget.userName} · {repostTarget.topic ?? repostTarget.stock}</div>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{repostTarget.content}</p>
            </div>
            <textarea value={repostComment} onChange={e => setRepostComment(e.target.value)}
              placeholder="Add your take on this…" rows={3} maxLength={400}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13, border: '1px solid rgba(5,150,105,0.2)', outline: 'none', resize: 'vertical', background: '#F9FFFE', color: '#064E3B', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => { setRepostTarget(null); setRepostComment('') }} style={{ padding: '8px 16px', borderRadius: 10, background: '#F3F4F6', color: '#374151', border: 'none', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitRepost} disabled={reposting || !repostComment.trim()}
                style={{ padding: '8px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (reposting || !repostComment.trim()) ? 0.4 : 1 }}>
                {reposting ? 'Resharing…' : 'Reshare →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
