import { NextRequest, NextResponse } from "next/server"

const ALLOWED_HOSTS = new Set([
  "image.tmdb.org",
  "www.themoviedb.org",
  "media.themoviedb.org",
])

function isAllowedProxyUrl(raw: string): URL | null {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  if (parsed.protocol !== "https:") return null
  if (parsed.username || parsed.password) return null

  const host = parsed.hostname.toLowerCase()
  if (ALLOWED_HOSTS.has(host)) return parsed

  // Supabase project storage / CDN: *.supabase.co
  if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) {
    return parsed
  }

  return null
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL não fornecida" }, { status: 400 })
  }

  const parsed = isAllowedProxyUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: "URL não permitida" }, { status: 400 })
  }

  try {
    const response = await fetch(parsed.toString(), {
      redirect: "manual",
      headers: { Accept: "image/*,*/*;q=0.8" },
    })

    // Do not follow redirects to arbitrary hosts.
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: "Redirect blocked" }, { status: 400 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Falha ao buscar imagem" }, { status: 502 })
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase()
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Resposta não é imagem" }, { status: 400 })
    }

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType.split(";")[0] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Erro ao buscar imagem:", error)
    return NextResponse.json({ error: "Erro ao buscar imagem" }, { status: 500 })
  }
}
