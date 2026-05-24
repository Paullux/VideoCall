import { randomBytes, createHash } from 'crypto'

const REDIRECT_URI = 'videocall://callback'

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32))
}

export function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(createHash('sha256').update(verifier).digest())
}

export function generateState(): string {
  return randomBytes(16).toString('hex')
}

export function buildAuthUrl(
  kindeDomain: string,
  clientId: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${kindeDomain}/oauth2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(
  kindeDomain: string,
  clientId: string,
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; idToken: string; refreshToken: string }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  })

  const res = await fetch(`${kindeDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  const data = await res.json() as Record<string, string>
  return { accessToken: data.access_token, idToken: data.id_token, refreshToken: data.refresh_token }
}

export async function refreshAccessToken(
  kindeDomain: string,
  clientId: string,
  refreshToken: string
): Promise<{ accessToken: string; idToken: string }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  })

  const res = await fetch(`${kindeDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json() as Record<string, string>
  return { accessToken: data.access_token, idToken: data.id_token }
}

export function parseJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJwtPayload(token)
    return Date.now() >= (payload.exp as number) * 1000 - 60_000
  } catch {
    return true
  }
}
