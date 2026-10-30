import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { resolveUid } from '@/lib/resolve-uid'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null

// Provider chain: Gemini → Anthropic → Groq → OpenRouter

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { system, messages, max_tokens } = await req.json()
  const userContent: string = messages?.[0]?.content ?? ''
  const combinedPrompt = system ? `${system}\n\n${userContent}` : userContent

  let responseData: { content: { type: string; text: string }[] } | null = null

  // ── 1. Gemini ────────────────────────────────────────────────────────────────
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: combinedPrompt,
        config: { maxOutputTokens: max_tokens ?? 1200, temperature: 0.3 },
      })
      const text = response.text ?? ''
      if (text) responseData = { content: [{ type: 'text', text }] }
    } catch (err: any) {
      console.warn('[venture/claude] Gemini failed:', err.message)
    }
  }

  // ── 2. Anthropic ─────────────────────────────────────────────────────────────
  if (!responseData && anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: max_tokens ?? 1200,
        system,
        messages,
      })
      responseData = response as any
    } catch (err: any) {
      console.warn('[venture/claude] Anthropic failed:', err.message)
    }
  }

  // ── 3. Groq ──────────────────────────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY
  if (!responseData && groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: combinedPrompt }],
          max_tokens: max_tokens ?? 1200,
          temperature: 0.3,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text: string = data.choices?.[0]?.message?.content ?? ''
        if (text) responseData = { content: [{ type: 'text', text }] }
      } else {
        console.warn('[venture/claude] Groq returned', res.status)
      }
    } catch (err: any) {
      console.warn('[venture/claude] Groq failed:', err.message)
    }
  }

  // ── 4. OpenRouter (Llama 3.3 70B free → Qwen 72B free) ──────────────────────
  const orKey = process.env.OPENROUTER_API_KEY
  if (!responseData && orKey && orKey !== 'your_openrouter_api_key_here') {
    for (const model of ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free']) {
      if (responseData) break
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${orKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://dhanveda.com',
            'X-Title': 'ArthaSift',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: combinedPrompt }],
            max_tokens: max_tokens ?? 1200,
            temperature: 0.3,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const text: string = data.choices?.[0]?.message?.content ?? ''
          if (text) responseData = { content: [{ type: 'text', text }] }
        }
      } catch (err: any) {
        console.warn(`[venture/claude] OpenRouter ${model} failed:`, err.message)
      }
    }
  }

  if (!responseData) {
    return NextResponse.json({ error: 'All AI providers unavailable. Please check your API keys.' }, { status: 503 })
  }

  // Track tokens non-blocking — failure must not affect the response
  const estimatedTokens = Math.round(combinedPrompt.length / 4) + (max_tokens ?? 1200)
  resolveUid(session)
    .then(uid => {
      if (!uid) return
      return db.execute(sql`UPDATE users SET tokens_used = COALESCE(tokens_used, 0) + ${estimatedTokens} WHERE id = ${uid}`)
    })
    .catch((e: any) => console.error('[venture/claude] token tracking failed:', e.message))

  return NextResponse.json(responseData)
}
