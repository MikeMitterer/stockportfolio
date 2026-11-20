/** Sitzungscookie, Anmeldeprüfung und Token-Tausch am Ende einer Anfrage (T-98). */
import { getCookie, setCookie } from 'hono/cookie'
import { ServiceError, type AccountService, type PublicUser } from '../auth/service.js'
import type { ServerContext } from './request.js'

export const cookieName = 'stockportfolio_session'

/** Cookie-Eigenschaften je Server: `Secure` nach Konfiguration, Laufzeit gleich der Leerlauffrist (T-98). */
export interface SessionCookie {
  secure: boolean
  maxAgeSeconds: number
}

/** Token einer authentifizierten Anfrage; nach dem Tausch am Ende der Anfrage der Nachfolger. */
interface SessionRenewal {
  token: string
}

/**
 * Sitzungscookie, das die Antwort am Ende der Anfrage setzt, samt Token-Tausch
 * (T-98). Erst dort: So erreicht es auch Antworten, die eine Route selbst baut
 * (StockInfo-Weiterleitung), eine lange Anfrage verbraucht die Übergangsfrist
 * des alten Tokens nicht, und eine langsamere ältere Antwort setzt kein Token
 * mehr, das eine andere Anfrage inzwischen getauscht hat.
 */
const pendingSessionCookie = new WeakMap<ServerContext, SessionRenewal>()

export function token(context: ServerContext): string {
  const value = getCookie(context, cookieName)
  if (!value) throw new ServiceError(401, 'unauthorized')
  return value
}

/**
 * Prüft und verlängert die Sitzung und merkt für die Antwort das Cookie mit
 * der vollen Leerlauffrist vor; getauscht wird am Ende der Anfrage. Server und
 * Browser zählen so ab derselben Nutzung. `null` lässt das Cookie unverändert,
 * wenn die Route selbst ein neues setzt — zwei `Set-Cookie` desselben Namens
 * ließen offen, welches der Browser behält.
 *
 * @returns Benutzer und das Token, mit dem der Browser weiterarbeitet; nach
 *   dem Tausch am Ende der Anfrage steht dort der Nachfolger.
 */
export function authenticated(
  context: ServerContext,
  service: AccountService,
  cookie: SessionCookie | null,
  allowPasswordChange = false,
): { user: PublicUser; session: SessionRenewal } {
  const session: SessionRenewal = { token: token(context) }
  const user = service.session(session.token)
  if (cookie) pendingSessionCookie.set(context, session)
  if (user.mustChangePassword && !allowPasswordChange)
    throw new ServiceError(403, 'password_change_required')
  return { user, session }
}

export function currentUser(
  context: ServerContext,
  service: AccountService,
  cookie: SessionCookie | null,
  allowPasswordChange = false,
): PublicUser {
  return authenticated(context, service, cookie, allowPasswordChange).user
}

export function requireAdmin(
  context: ServerContext,
  service: AccountService,
  cookie: SessionCookie,
): PublicUser {
  const user = currentUser(context, service, cookie)
  if (user.role !== 'admin') throw new ServiceError(403, 'forbidden')
  return user
}

export function setSessionCookie(
  context: ServerContext,
  value: string,
  cookie: SessionCookie,
): void {
  setCookie(context, cookieName, value, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: cookie.secure,
    path: '/',
    maxAge: cookie.maxAgeSeconds,
  })
}

/** Tauscht am Ende der Anfrage das vorgemerkte Token und setzt das neue Cookie. */
export function renewPendingSession(
  context: ServerContext,
  service: AccountService,
  cookie: SessionCookie,
): void {
  const pending = pendingSessionCookie.get(context)
  if (pending === undefined) return
  const renewed = service.renew(pending.token)
  if (renewed === null) return
  pending.token = renewed
  setSessionCookie(context, renewed, cookie)
}
