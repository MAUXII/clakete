import { NextRequest, NextResponse } from "next/server"
import { aggregateCinemasByCity, resolveCitySlug } from "@/lib/cinemas/aggregate"
import {
  assertCinemasSecret,
  checkRateLimit,
  getClientIp,
} from "@/lib/cinemas/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type RouteContext = {
  params: Promise<{ citySlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!assertCinemasSecret(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const ip = getClientIp(request)
    const limit = checkRateLimit(`cinemas:${ip}`)
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em instantes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "X-RateLimit-Remaining": "0",
          },
        },
      )
    }

    const { citySlug: rawSlug } = await context.params
    const { searchParams } = request.nextUrl
    const latParam = searchParams.get("lat")
    const lngParam = searchParams.get("lng")
    const refresh = searchParams.get("refresh") === "1"
    const prefer = searchParams.get("prefer") as
      | "ingresso"
      | "cinemark"
      | "auto"
      | null

    const lat = latParam != null ? Number(latParam) : null
    const lng = lngParam != null ? Number(lngParam) : null

    const citySlug = await resolveCitySlug({
      citySlug: rawSlug === "_" || rawSlug === "near" ? null : rawSlug,
      lat,
      lng,
    })

    const payload = await aggregateCinemasByCity({
      citySlug,
      lat,
      lng,
      refresh,
      prefer: prefer || "auto",
    })

    return NextResponse.json(payload, {
      headers: {
        "X-RateLimit-Remaining": String(limit.remaining),
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (error) {
    console.error("[api/cinemas]", error)
    const message =
      error instanceof Error ? error.message : "Erro ao buscar cinemas"
    const status = /não encontrad/i.test(message) ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
