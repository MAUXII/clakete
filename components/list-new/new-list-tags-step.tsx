"use client"

import { useCallback, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_TAG_LEN = 48
const MAX_TAGS = 40
/** Max characters shown on each chip; longer tags get an ellipsis (full text in `title`). */
const TAG_LABEL_VISIBLE_CHARS = 8

function formatTagLabel(tag: string) {
  if (tag.length <= TAG_LABEL_VISIBLE_CHARS) return tag
  return `${tag.slice(0, TAG_LABEL_VISIBLE_CHARS)}…`
}

function normalizeTag(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ")
  if (!t || t.length > MAX_TAG_LEN) return null
  return t
}

interface NewListTagsStepProps {
  selectedTags: string[]
  onChangeSelected: (tags: string[]) => void
}

export function NewListTagsStep({ selectedTags, onChangeSelected }: NewListTagsStepProps) {
  const [draft, setDraft] = useState("")

  const lowerSet = useCallback(
    () => new Set(selectedTags.map((t) => t.toLowerCase())),
    [selectedTags],
  )

  const addStrings = useCallback(
    (rawParts: string[]) => {
      const next = [...selectedTags]
      const seen = lowerSet()
      for (const part of rawParts) {
        const tag = normalizeTag(part)
        if (!tag || next.length >= MAX_TAGS) break
        const low = tag.toLowerCase()
        if (seen.has(low)) continue
        seen.add(low)
        next.push(tag)
      }
      if (next.length !== selectedTags.length) onChangeSelected(next)
    },
    [selectedTags, onChangeSelected, lowerSet],
  )

  const remove = (tag: string) => {
    onChangeSelected(selectedTags.filter((t) => t !== tag))
  }

  const commitDraft = () => {
    if (!draft.trim()) return
    const parts = draft.split(",").map((p) => p.trim())
    addStrings(parts)
    setDraft("")
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-3 sm:px-4">
      <div className="min-w-0 shrink-0 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Add tags to your list</h2>
        <div className="mt-1 flex min-h-[3rem] items-start justify-center sm:min-h-[3.25rem]">
          <p className="text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
            Press Enter to add — use commas for several at once.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-md">
        {selectedTags.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                title={tag.length > TAG_LABEL_VISIBLE_CHARS ? tag : undefined}
                aria-label={`Remove tag ${tag}`}
                onClick={() => remove(tag)}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.03] py-1 pl-2.5 pr-1 text-[13px] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]",
                )}
              >
                <span className="min-w-0 shrink">{formatTagLabel(tag)}</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 hover:text-white">
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitDraft()
            }
          }}
          onBlur={() => {
            const t = draft.trim()
            if (t) commitDraft()
          }}
          placeholder="Add a tag (optional)…"
          maxLength={200}
          autoComplete="off"
          className="w-full border-0 border-b border-white/10 bg-transparent py-3 text-[15px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#FF0048]/60"
        />
      </div>
    </div>
  )
}
