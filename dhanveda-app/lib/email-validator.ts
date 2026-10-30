const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, reason: 'Invalid email format.' }
  }

  const key = process.env.ABSTRACT_API_KEY
  if (!key || key.startsWith('your_')) return { valid: true }

  try {
    const res = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${key}&email=${encodeURIComponent(email)}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return { valid: true } // fail open on API error

    const data = await res.json()

    if (data.is_disposable_email?.value === true) {
      return { valid: false, reason: 'Disposable or temporary email addresses are not allowed.' }
    }
    if (data.deliverability === 'UNDELIVERABLE') {
      return { valid: false, reason: 'This email address does not appear to be valid.' }
    }
    if (data.is_valid_format?.value === false) {
      return { valid: false, reason: 'Invalid email format.' }
    }
  } catch {
    // Fail open — don't block signup if API is down
  }

  return { valid: true }
}
