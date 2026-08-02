"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  flagImageUrl,
  TMDB_LANGUAGE_OPTIONS,
  WATCH_REGION_OPTIONS,
  type TmdbLanguageId,
  type WatchRegionId,
} from "@/lib/locale-prefs"
import { cn } from "@/lib/utils"

function FlagIcon({
  flagCode,
  className,
}: {
  flagCode: string
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagImageUrl(flagCode, 40)}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className={cn(
        "pointer-events-none h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-border/60",
        className,
      )}
    />
  )
}

const triggerClass = cn(
  "h-10 gap-2",
  // shadcn aplica line-clamp no span do SelectValue e estoura o layout
  "[&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1",
  "[&>span]:items-center [&>span]:justify-start [&>span]:gap-2",
)

export function WatchRegionSelect({
  id,
  label,
  value,
  onValueChange,
  hint,
  triggerClassName,
}: {
  id?: string
  label: string
  value: WatchRegionId | string
  onValueChange: (value: WatchRegionId) => void
  hint?: string
  triggerClassName?: string
}) {
  const selected =
    WATCH_REGION_OPTIONS.find((r) => r.id === value) ?? WATCH_REGION_OPTIONS[0]

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Select
        value={selected.id}
        onValueChange={(v) => onValueChange(v as WatchRegionId)}
      >
        <SelectTrigger id={id} className={cn(triggerClass, triggerClassName)}>
          <SelectValue aria-label={selected.label}>
            <FlagIcon flagCode={selected.flagCode} />
            <span className="truncate">{selected.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {WATCH_REGION_OPTIONS.map((region) => (
            <SelectItem
              key={region.id}
              value={region.id}
              textValue={region.label}
            >
              <span className="flex items-center gap-2">
                <FlagIcon flagCode={region.flagCode} />
                <span>{region.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function ContentLanguageSelect({
  id,
  label,
  value,
  onValueChange,
  hint,
  triggerClassName,
}: {
  id?: string
  label: string
  value: TmdbLanguageId | string
  onValueChange: (value: TmdbLanguageId) => void
  hint?: string
  triggerClassName?: string
}) {
  const selected =
    TMDB_LANGUAGE_OPTIONS.find((l) => l.id === value) ?? TMDB_LANGUAGE_OPTIONS[0]

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Select
        value={selected.id}
        onValueChange={(v) => onValueChange(v as TmdbLanguageId)}
      >
        <SelectTrigger id={id} className={cn(triggerClass, triggerClassName)}>
          <SelectValue aria-label={selected.label}>
            <FlagIcon flagCode={selected.flagCode} />
            <span className="truncate">{selected.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TMDB_LANGUAGE_OPTIONS.map((lang) => (
            <SelectItem key={lang.id} value={lang.id} textValue={lang.label}>
              <span className="flex items-center gap-2">
                <FlagIcon flagCode={lang.flagCode} />
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
