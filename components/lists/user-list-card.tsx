"use client";

import Image from "next/image";
import { List } from "@/types/list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  listCardMinHeightClassName,
  listCardCompactMinHeightClassName,
  listCardBannerRegionClass,
  listCardPosterStackOffsetClass,
  listCardBodyBlockClass,
} from "@/components/lists/list-card-shell";
import { ListPosterStack } from "@/components/lists/list-poster-stack";
import { listPublicHref, userProfilePath } from "@/lib/list-href";
import { listBannerPresentation } from "@/lib/list-banner";
import { cn } from "@/lib/utils";

interface UserListCardProps {
  list: List;
  compact?: boolean;
}

function normalizedSlots(list: List): (string | null)[] {
  const first = (list.preview_posters ?? []).slice(0, 5);
  const slots: (string | null)[] = [...first];
  while (slots.length < 5) slots.push(null);
  return slots;
}

export function UserListCard({ list, compact = false }: UserListCardProps) {
  const displayName = list.userData?.display_name || list.userData?.username || "User";
  const banner = listBannerPresentation(list);
  const bannerSrc = banner.src;
  const hasItems = (list.films_count ?? 0) > 0;
  const bio = list.bio?.trim() ?? "";
  const listHref = listPublicHref(list);

  if (compact) {
    return (
      <div
        className={cn(
          "relative flex w-full flex-col items-center pb-2 pt-1",
          listCardCompactMinHeightClassName,
        )}
      >
        <Link
          href={listHref}
          aria-label={`Open list: ${list.title}`}
          className="absolute inset-0 z-[1] rounded-xl outline-none ring-inset focus-visible:ring-2 focus-visible:ring-[#e94e7a]/40"
        />
        <div className="relative z-[2] flex w-full flex-col items-center gap-1.5 pointer-events-none">
          <div className="w-full min-w-0 pt-0.5">
            <ListPosterStack posters={normalizedSlots(list)} compact />
          </div>
          <h3 className="line-clamp-2 w-full px-1 text-sm font-normal leading-snug tracking-tight text-foreground/90 sm:text-[0.95rem]">
            {list.title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex h-full min-w-0 w-full flex-col overflow-hidden rounded-2xl",
        listCardMinHeightClassName,
      )}
    >
      <Link
        href={listHref}
        aria-label={`Open list: ${list.title}`}
        className="absolute inset-0 z-[1] rounded-2xl outline-none ring-inset focus-visible:ring-2 focus-visible:ring-[#e94e7a]/40"
      />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className={cn("relative isolate", listCardBannerRegionClass.default)}>
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
            {bannerSrc ? (
              <>
                <Image
                  src={bannerSrc}
                  alt=""
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1280px) 33vw, 420px"
                  style={banner.objectPosition ? { objectPosition: banner.objectPosition } : undefined}
                  className={`object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-[1.03] ${banner.objectPosition ? "" : "object-center"}`}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-transparent from-[12%] via-card/25 via-[48%] to-card dark:via-card/35"
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/65 to-muted/35" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(233,78,122,0.08),transparent_55%)]" />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-transparent from-[18%] via-card/35 via-[52%] to-card"
                />
              </>
            )}
          </div>
          {hasItems ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 sm:px-4">
              <div
                aria-hidden
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2",
                  listCardPosterStackOffsetClass.default,
                )}
              >
                <ListPosterStack posters={normalizedSlots(list)} />
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col",
            hasItems ? listCardBodyBlockClass.defaultWithItems : listCardBodyBlockClass.defaultNoItems,
          )}
        >
          <div className="min-w-0 space-y-1.5">
            <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[#e94e7a] sm:text-xl">
              {list.title}
            </h3>
            {bio ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
            ) : null}
          </div>

          <div className="mt-auto flex min-w-0 items-center gap-2.5 border-t border-border/70 pt-3 pointer-events-auto">
            <Link href={userProfilePath(list.userData?.username)} className="shrink-0">
              <Avatar className="h-8 w-8 ring-2 ring-background">
                <AvatarImage src={list.userData?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-[11px] font-medium">
                  {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Created by</p>
              <Link
                href={userProfilePath(list.userData?.username)}
                className="block truncate text-sm font-medium text-foreground transition-colors hover:text-[#e94e7a]"
              >
                {displayName}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
