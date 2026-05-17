"use client"

import { GenrePickerGrid } from "@/components/list-new/genre-picker-grid"

export interface GenreOption {
  id: number
  name: string
}

interface NewListGenreStepProps {
  selectedIds: number[]
  onChangeSelected: (ids: number[]) => void
  title?: string
  description?: string
}

export function NewListGenreStep({
  selectedIds,
  onChangeSelected,
  title = "Add genres to your list",
  description = "Choose one or more genres — we'll use them to suggest movies in the next step.",
}: NewListGenreStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-3 sm:px-4">
      <div className="min-w-0 shrink-0 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        <div className="mt-1 flex min-h-[3rem] items-start justify-center sm:min-h-[3.25rem]">
          <p className="text-xs leading-relaxed text-zinc-500 sm:text-[13px]">{description}</p>
        </div>
      </div>

      <GenrePickerGrid
        selectedIds={selectedIds}
        onChangeSelected={onChangeSelected}
        className="mt-6"
        language="en-US"
        variant="list"
      />
    </div>
  )
}
