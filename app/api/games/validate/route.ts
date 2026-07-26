import { NextResponse } from "next/server"
import { resolveTmdbLanguage } from "@/lib/locale-prefs"
import {
  gamesTmdbConfig,
  movieCastIds,
  personMovieIds,
} from "@/lib/games/tmdb-cache"

type NodeRef = {
  id: number
  kind: "person" | "movie"
  key: string
}

/**
 * Validate a guessed node against every node already on the board.
 * The game is a graph: guesses may grow from A, B, or any existing branch.
 */
export async function POST(request: Request) {
  try {
    const { TMDB_API_KEY } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const body = (await request.json()) as {
      candidate?: NodeRef
      board?: NodeRef[]
      language?: string
    }
    const language = resolveTmdbLanguage(body.language)
    const candidate = body.candidate
    const board = Array.isArray(body.board) ? body.board : []
    if (
      !candidate ||
      !Number.isInteger(candidate.id) ||
      !["person", "movie"].includes(candidate.kind)
    ) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 })
    }

    const opposite = board.filter(
      (node) =>
        Number.isInteger(node.id) &&
        node.kind !== candidate.kind &&
        (node.kind === "person" || node.kind === "movie"),
    )
    if (opposite.length === 0) {
      return NextResponse.json({ ok: false, connectedKeys: [] })
    }

    const connectedKeys: string[] = []
    if (candidate.kind === "movie") {
      const cast = await movieCastIds(candidate.id, language)
      for (const person of opposite) {
        if (cast.has(person.id)) connectedKeys.push(person.key)
      }
    } else {
      // One person→movies call instead of N movie→cast fetches
      const movies = await personMovieIds(candidate.id, language)
      for (const movie of opposite) {
        if (movies.has(movie.id)) connectedKeys.push(movie.key)
      }
    }

    return NextResponse.json({
      ok: connectedKeys.length > 0,
      connectedKeys,
    })
  } catch (error) {
    console.error("game graph validate error:", error)
    return NextResponse.json({ ok: false, connectedKeys: [] }, { status: 500 })
  }
}

/**
 * Validate a move: person→movie (person in cast) or movie→person (person in cast).
 * Kept for backwards compatibility with direct edge checks.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fromKind = searchParams.get("fromKind") === "movie" ? "movie" : "person"
    const fromId = searchParams.get("fromId")
    const toKind = searchParams.get("toKind") === "movie" ? "movie" : "person"
    const toId = searchParams.get("toId")
    const language = resolveTmdbLanguage(searchParams.get("language"))
    if (
      !fromId ||
      !toId ||
      !/^\d+$/.test(fromId) ||
      !/^\d+$/.test(toId) ||
      fromKind === toKind
    ) {
      return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 })
    }
    const { TMDB_API_KEY } = gamesTmdbConfig()
    if (!TMDB_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    const movieId = fromKind === "movie" ? fromId : toId
    const personId = fromKind === "person" ? fromId : toId

    const cast = await movieCastIds(Number(movieId), language)
    return NextResponse.json({ ok: cast.has(Number(personId)) })
  } catch (error) {
    console.error("game validate error:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
