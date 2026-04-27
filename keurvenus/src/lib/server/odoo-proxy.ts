import { request as httpRequest } from "node:http"
import { request as httpsRequest } from "node:https"

const odooOrigin = process.env.ODOO_PROXY_TARGET ?? "http://127.0.0.1:8069"
const odooDatabase = process.env.ODOO_DATABASE ?? "kervenus_c19"
const backofficeUrl = process.env.ODOO_BACKOFFICE_URL ?? buildDefaultBackofficeUrl()
const bodyMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])

type ProxyMode = "api" | "root"

type OdooJsonRpcPayload = {
  result?: Record<string, any>
  error?: {
    message?: string
    data?: {
      message?: string
      debug?: string
    }
  }
}

type OdooJsonRpcResponse = {
  status: number
  statusText: string
  headers: Headers
  payload: OdooJsonRpcPayload
}

export async function proxyToOdoo(
  request: Request,
  splat: string,
  mode: ProxyMode
) {
  const storefrontAuthRedirect = getStorefrontAuthRedirect(request, splat, mode)
  if (storefrontAuthRedirect) {
    return Response.redirect(storefrontAuthRedirect, 302)
  }

  if (mode === "api" && splat.startsWith("keurvenus/storefront/")) {
    const response = await handleStorefrontSessionRequest(request, splat)
    if (response) {
      return response
    }
  }

  const incomingUrl = new URL(request.url)
  const targetPath = mode === "api" ? `/api/${splat ?? ""}` : `/${splat ?? ""}`
  const target = new URL(targetPath, odooOrigin)
  target.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.set("x-odoo-database", odooDatabase)

  const requestInit: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (bodyMethods.has(request.method)) {
    requestInit.body = await request.text()
  }

  const response = await fetch(target, requestInit)
  const forwardedHeaders = buildForwardedHeaders(response)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: forwardedHeaders,
  })
}

function getStorefrontAuthRedirect(request: Request, splat: string, mode: ProxyMode) {
  if (mode !== "root") return null
  const normalized = (splat || "").replace(/^\/+/, "")
  if (normalized !== "web/signup" && normalized !== "web/reset_password") return null

  const incomingUrl = new URL(request.url)
  const target = new URL(normalized === "web/signup" ? "/register" : "/reset-password", incomingUrl.origin)
  target.search = incomingUrl.search
  return target.toString()
}

async function handleStorefrontSessionRequest(request: Request, splat: string) {
  const endpoint = splat.replace(/^keurvenus\/storefront\/?/, "")

  if (endpoint === "session" && request.method === "GET") {
    return buildSessionResponse(request)
  }

  if (endpoint === "session/login" && request.method === "POST") {
    const credentials = await request.json().catch(() => ({}))
    return loginToOdoo(credentials.login, credentials.password)
  }

  if (endpoint === "session/logout" && request.method === "POST") {
    return logoutFromOdoo(request)
  }

  return null
}

async function buildSessionResponse(request: Request) {
  const response = await callOdooJsonRpc("/web/session/get_session_info", {}, request)
  const { payload } = response
  const forwardedHeaders = response.headers
  forwardedHeaders.set("content-type", "application/json")

  if (!response.ok || payload.error || !payload.result?.uid) {
    return jsonResponse({ session: emptySession() }, 200, forwardedHeaders)
  }

  return jsonResponse(
    { session: await mapSessionInfo(payload.result, request.headers.get("cookie")) },
    response.status,
    forwardedHeaders
  )
}

async function loginToOdoo(login?: string, password?: string) {
  if (!login || !password) {
    return jsonResponse({ error: "Email et mot de passe requis." }, 400)
  }

  const response = await callOdooJsonRpc("/web/session/authenticate", {
    db: odooDatabase,
    login,
    password,
  })
  const { payload } = response
  const forwardedHeaders = response.headers
  forwardedHeaders.set("content-type", "application/json")

  if (!response.ok || payload.error || !payload.result?.uid) {
    const message =
      payload.error?.data?.message ||
      payload.error?.message ||
      "Identifiants invalides ou base de donnees indisponible."
    return jsonResponse({ error: message }, response.ok ? 401 : response.status, forwardedHeaders)
  }

  return jsonResponse(
    { session: await mapSessionInfo(payload.result, getSessionCookieHeader(forwardedHeaders)) },
    response.status,
    forwardedHeaders
  )
}

async function logoutFromOdoo(request: Request) {
  const response = await callOdooJsonRpc("/web/session/destroy", {}, request)
  const forwardedHeaders = response.headers
  forwardedHeaders.set("content-type", "application/json")
  return jsonResponse({ ok: true, session: emptySession() }, 200, forwardedHeaders)
}

async function callOdooJsonRpc(
  path: string,
  params: Record<string, any>,
  request?: Request
): Promise<OdooJsonRpcResponse & { ok: boolean }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const cookie = request?.headers.get("cookie")
  if (cookie) {
    headers.cookie = cookie
  }

  return requestOdooJsonRpc(new URL(path, odooOrigin), headers, {
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
  })
}

function requestOdooJsonRpc(
  url: URL,
  headers: Record<string, string>,
  body: Record<string, any>
): Promise<OdooJsonRpcResponse & { ok: boolean }> {
  const client = url.protocol === "https:" ? httpsRequest : httpRequest
  const payload = JSON.stringify(body)

  return new Promise((resolve, reject) => {
    const req = client(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8")
          let parsedPayload: OdooJsonRpcPayload = {}
          try {
            parsedPayload = JSON.parse(text)
          } catch {
            parsedPayload = {
              error: {
                message: res.statusMessage || "La requête boutique a échoué.",
                data: { message: text },
              },
            }
          }
          const responseHeaders = new Headers()
          for (const [key, value] of Object.entries(res.headers)) {
            if (!value) continue
            if (Array.isArray(value)) {
              for (const item of value) {
                responseHeaders.append(key, item)
              }
            } else {
              responseHeaders.set(key, value)
            }
          }

          resolve({
            ok: Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 300),
            status: res.statusCode || 500,
            statusText: res.statusMessage || "",
            headers: responseHeaders,
            payload: parsedPayload,
          })
        })
      }
    )

    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

async function mapSessionInfo(info: Record<string, any>, cookie?: string | null) {
  const isInternalUser = Boolean(info.is_internal_user)
  const userName = String(info.name || info.partner_display_name || info.username || "")
  const userLogin = String(info.username || "")
  const userId = Number(info.uid)
  const partnerId = Number(info.partner_id || 0)
  const avatarUnique = String(info.partner_write_date || info.registry_hash || userId)
  const avatarUrl = `/odoo/web/image/res.users/${userId}/image_128?unique=${encodeURIComponent(avatarUnique)}`
  const hasAvatar = await hasUploadedBackofficeAvatar(userId, cookie)

  return {
    authenticated: true,
    user: {
      id: userId,
      name: userName,
      login: userLogin,
      is_internal_user: isInternalUser,
      avatar_url: hasAvatar ? avatarUrl : undefined,
      partner: {
        id: partnerId,
        name: String(info.partner_display_name || userName),
        email: userLogin.includes("@") ? userLogin : null,
      },
    },
    cart_count: 0,
    wishlist_count: 0,
    payment_url: "/checkout",
    portal_url: "/portal",
    portal_links: [],
    odoo_base_url: odooOrigin,
    backoffice_url: backofficeUrl,
    signup_enabled: true,
    is_internal_user: isInternalUser,
  }
}

async function hasUploadedBackofficeAvatar(userId: number, cookie?: string | null) {
  if (!userId || !cookie) {
    return false
  }

  const contentType = await getOdooImageContentType(
    new URL(`/web/image/res.users/${userId}/image_128`, odooOrigin),
    cookie
  )
  return Boolean(contentType?.startsWith("image/") && !contentType.includes("svg"))
}

function getOdooImageContentType(url: URL, cookie: string): Promise<string | null> {
  const client = url.protocol === "https:" ? httpsRequest : httpRequest

  return new Promise((resolve) => {
    const req = client(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { cookie },
      },
      (res) => {
        const contentType = String(res.headers["content-type"] || "")
        res.resume()
        res.on("end", () => resolve(contentType || null))
      }
    )

    req.on("error", () => resolve(null))
    req.end()
  })
}

function getSessionCookieHeader(headers: Headers) {
  const directCookie = headers.get("set-cookie") || ""
  const match = directCookie.match(/session_id=[^;,]+/)
  return match?.[0] || null
}

function emptySession() {
  return {
    authenticated: false,
    user: null,
    cart_count: 0,
    wishlist_count: 0,
    payment_url: "/checkout",
    portal_url: "/portal",
    portal_links: [],
    odoo_base_url: odooOrigin,
    backoffice_url: backofficeUrl,
    signup_enabled: true,
    is_internal_user: false,
  }
}

function buildDefaultBackofficeUrl() {
  try {
    const url = new URL(odooOrigin)
    if (url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") {
      url.hostname = "localhost"
    }
    url.pathname = "/odoo"
    url.search = ""
    url.hash = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return "http://localhost:8069/odoo"
  }
}

function jsonResponse(payload: unknown, status = 200, headers = new Headers()) {
  headers.delete("content-length")
  headers.delete("content-encoding")
  headers.delete("transfer-encoding")
  headers.set("content-type", "application/json")
  return new Response(JSON.stringify(payload), {
    status,
    headers,
  })
}

function buildForwardedHeaders(response: Response) {
  const forwardedHeaders = new Headers()

  for (const [key, value] of response.headers.entries()) {
    if (
      key === "content-length" ||
      key === "content-encoding" ||
      key === "transfer-encoding" ||
      key === "set-cookie" ||
      key === "x-frame-options" ||
      key === "content-security-policy"
    ) {
      continue
    }

    forwardedHeaders.append(key, rewriteHeaderLocation(key, value))
  }

  const setCookieAccessor = response.headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof setCookieAccessor.getSetCookie === "function") {
    for (const cookie of setCookieAccessor.getSetCookie()) {
      forwardedHeaders.append("set-cookie", cookie)
    }
  } else {
    const cookie = response.headers.get("set-cookie")
    if (cookie) {
      forwardedHeaders.append("set-cookie", cookie)
    }
  }

  return forwardedHeaders
}

function rewriteHeaderLocation(key: string, value: string) {
  if (key !== "location") return value

  try {
    const location = new URL(value, odooOrigin)
    const origin = new URL(odooOrigin)
    if (location.origin === origin.origin) {
      return `${location.pathname}${location.search}${location.hash}`
    }
  } catch {
    return value
  }

  return value
}
