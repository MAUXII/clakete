import { NextResponse } from "next/server"
import axios from "axios"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import { reachableKeys } from "@/lib/games/connect-the-stars"
import {
  gamesTmdbConfig,
  movieCastIds,
  personMovieIds,
} from "@/lib/games/tmdb-cache"

type TmdbMovieCredit = {
  id?: number
  title?: string
  poster_path?: string | null
  release_date?: string
  popularity?: number
  vote_count?: number
  adult?: boolean
}

type TmdbCastCredit = {
  id?: number
  name?: string
  profile_path?: string | null
  character?: string
  order?: number
  popularity?: number
}

type BoardRef = {
  id: number
  kind: "person" | "movie"
  key: string
}

type EdgeRef = { a: string; b: string }

type HintBody = {
  kind?: "person" | "movie"
  id?: number
  originKey?: string
  targetKey?: string
  targetId?: number
  board?: BoardRef[]
  edges?: EdgeRef[]
  exclude?: string[]
  language?: string
}

/**
 * Graph-aware hint: prefer a next node that bridges toward the other side
 * (origin ↔ target components), not only “from this one node toward target”.
 */
export async function POST(request: Request) {
  try {
    const { TMDB_API_KEY, TMDB_BASE_URL } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const body = (await request.json()) as HintBody
    const language = resolveTmdbLanguage(body.language)
    const kind = body.kind === "movie" ? "movie" : "person"
    const id = body.id
    const exclude = new Set(
      (body.exclude ?? []).filter((s) => typeof s === "string" && s.length > 0),
    )
    const board = Array.isArray(body.board) ? body.board : []
    const edges = Array.isArray(body.edges) ? body.edges : []
    const originKey = body.originKey
    const targetKey = body.targetKey
    const targetId =
      typeof body.targetId === "number"
        ? body.targetId
        : Number.isFinite(Number(body.targetId))
          ? Number(body.targetId)
          : null

    if (!id || !Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const fromKey = `${kind}-${id}`
    const fromSide =
      originKey && edges.length > 0
        ? reachableKeys(edges, originKey)
        : new Set<string>([fromKey])
    const toSide =
      targetKey && edges.length > 0
        ? reachableKeys(edges, targetKey)
        : new Set<string>()

    // People already on the opposite component — great bridge targets for a film hint.
    const oppositePeople = board.filter(
      (n) =>
        n.kind === "person" &&
        toSide.has(n.key) &&
        !fromSide.has(n.key),
    )
    const oppositeMovies = board.filter(
      (n) =>
        n.kind === "movie" &&
        toSide.has(n.key) &&
        !fromSide.has(n.key),
    )

    if (kind === "person") {
      const { data } = await axios.get(
        `${TMDB_BASE_URL}/person/${id}/movie_credits`,
        { params: { api_key: TMDB_API_KEY, language } },
      )
      const movies = ((data.cast ?? []) as TmdbMovieCredit[])
        .filter(
          (m) =>
            m?.id &&
            m?.title &&
            !m.adult &&
            !exclude.has(`movie-${m.id}`) &&
            (m.vote_count ?? 0) >= 40,
        )
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))

      let pick = movies[0] ?? null

      // Prefer a film that already stars someone on the other component.
      if (oppositePeople.length > 0 && movies.length > 0) {
        const oppIds = new Set(oppositePeople.map((p) => p.id))
        const checks = await Promise.all(
          movies.slice(0, 12).map(async (m) => {
            try {
              const cast = await movieCastIds(m.id!, language)
              for (const pid of oppIds) {
                if (cast.has(pid)) return m
              }
              return null
            } catch {
              return null
            }
          }),
        )
        pick = checks.find(Boolean) ?? pick
      }

      // Else prefer a shared film with the destination actor.
      if (
        pick === movies[0] &&
        targetId &&
        Number.isInteger(targetId) &&
        movies.length > 0
      ) {
        const checks = await Promise.all(
          movies.slice(0, 10).map(async (m) => {
            try {
              const cast = await movieCastIds(m.id!, language)
              return cast.has(targetId) ? m : null
            } catch {
              return null
            }
          }),
        )
        pick = checks.find(Boolean) ?? pick
      }

      if (!pick?.id || !pick.title) {
        return NextResponse.json({ hint: null })
      }
      return NextResponse.json({
        hint: {
          id: pick.id,
          kind: "movie" as const,
          name: pick.title,
          imagePath: pick.poster_path ?? null,
          subtitle: pick.release_date?.slice(0, 4) || null,
        },
      })
    }

    const cast = (
      await axios.get(`${TMDB_BASE_URL}/movie/${id}/credits`, {
        params: { api_key: TMDB_API_KEY, language },
      })
    ).data.cast as TmdbCastCredit[]

    const people = (cast ?? []).filter(
      (p) => p?.id && p?.name && !exclude.has(`person-${p.id}`),
    )

    // Prefer someone already useful: target, or person who links to opposite films.
    const targetHit =
      targetId && Number.isInteger(targetId)
        ? people.find((p) => p.id === targetId)
        : null
    if (targetHit?.id && targetHit.name) {
      return NextResponse.json({
        hint: {
          id: targetHit.id,
          kind: "person" as const,
          name: targetHit.name,
          imagePath: targetHit.profile_path ?? null,
          subtitle: targetHit.character || null,
        },
      })
    }

    if (oppositeMovies.length > 0) {
      const oppMovieIds = new Set(oppositeMovies.map((m) => m.id))
      for (const person of people.slice(0, 16)) {
        try {
          const filmIds = await personMovieIds(person.id!, language)
          for (const mid of oppMovieIds) {
            if (filmIds.has(mid)) {
              return NextResponse.json({
                hint: {
                  id: person.id!,
                  kind: "person" as const,
                  name: person.name!,
                  imagePath: person.profile_path ?? null,
                  subtitle: person.character || null,
                },
              })
            }
          }
        } catch {
          /* try next */
        }
      }
    }

    const pick = people[0]
    if (!pick?.id || !pick.name) {
      return NextResponse.json({ hint: null })
    }
    return NextResponse.json({
      hint: {
        id: pick.id,
        kind: "person" as const,
        name: pick.name,
        imagePath: pick.profile_path ?? null,
        subtitle: pick.character || null,
      },
    })
  } catch (error) {
    console.error("game hint error:", error)
    return NextResponse.json({ error: "Hint failed" }, { status: 500 })
  }
}

/** Legacy GET hint (single-node, toward target). Prefer POST. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kind = searchParams.get("kind") === "movie" ? "movie" : "person"
    const id = Number(searchParams.get("id"))
    const targetId = searchParams.get("targetId")
    const language = resolveTmdbLanguage(searchParams.get("language"))
    const exclude = (searchParams.get("exclude") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await POST(
      new Request(request.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          id,
          targetId: targetId && /^\d+$/.test(targetId) ? Number(targetId) : null,
          exclude,
          language,
        }),
      }),
    )
    return res
  } catch (error) {
    console.error("game hint get error:", error)
    return NextResponse.json({ error: "Hint failed" }, { status: 500 })
  }
}
