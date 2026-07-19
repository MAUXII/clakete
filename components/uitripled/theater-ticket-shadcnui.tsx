"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Calendar, MapPin, Star, Ticket } from "lucide-react";
import { forwardRef } from "react";

export interface TheaterTicketProps {
  badge?: string;
  title?: string;
  titleAccent?: string;
  venue?: string;
  dateLabel?: string;
  dateValue?: string;
  timeLabel?: string;
  timeValue?: string;
  seatLabel?: string;
  seatValue?: string;
  stubText?: string;
  backdropUrl?: string | null;
  logoSrc?: string | null;
  /** Force a layout, or keep the original responsive (mobile=vertical) behavior. */
  orientation?: "horizontal" | "vertical" | "responsive";
  /** No outer padding — use when exporting just the ticket. */
  bare?: boolean;
}

export const TheaterTicket = forwardRef<HTMLDivElement, TheaterTicketProps>(
  function TheaterTicket(
    {
      badge = "PREMIERE",
      title = "THE PHANTOM",
      titleAccent = "OF THE OPERA",
      venue = "Royal Albert Hall",
      dateLabel = "Date",
      dateValue = "",
      timeLabel = "Time",
      timeValue = "",
      seatLabel = "Seat",
      seatValue = "",
      stubText = "ADMIT ONE",
      backdropUrl = null,
      logoSrc = null,
      orientation = "responsive",
      bare = false,
    },
    ref,
  ) {
    const horiz = orientation === "horizontal";
    const vert = orientation === "vertical";

    const containerDir = horiz
      ? "flex-row"
      : vert
        ? "flex-col"
        : "flex-col md:flex-row";
    const mainPad = horiz ? "p-8" : vert ? "p-6" : "p-6 md:p-8";
    const titleSize = horiz
      ? "text-4xl"
      : vert
        ? "text-3xl"
        : "text-3xl md:text-4xl";
    const vRipCls = horiz ? "flex" : vert ? "hidden" : "hidden md:flex";
    const hRipCls = vert ? "flex" : horiz ? "hidden" : "flex md:hidden";
    const stubCls = horiz
      ? "w-32 border-l"
      : vert
        ? "w-full border-t"
        : "w-full md:w-32 border-t md:border-t-0 md:border-l";
    const barcodeCls = horiz
      ? "flex-col space-y-1 h-24"
      : vert
        ? "space-x-1 h-12"
        : "md:flex-col space-x-1 md:space-x-0 md:space-y-1 h-12 md:h-24";
    const barThin = horiz
      ? "w-full h-1"
      : vert
        ? "w-1 h-full"
        : "w-1 h-full md:w-full md:h-1";
    const barThick = horiz
      ? "w-full h-2"
      : vert
        ? "w-2 h-full"
        : "w-2 h-full md:w-full md:h-2";
    const stubTextCls = horiz
      ? "rotate-90 mt-8"
      : vert
        ? "mt-2"
        : "md:rotate-90 mt-2 md:mt-8";

    const ticket = (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={bare ? undefined : { scale: 1.02 }}
        className={`group relative flex w-full max-w-2xl min-h-[280px] ${containerDir} overflow-hidden rounded-xl bg-card border border-border shadow-2xl`}
        role="article"
        aria-label={`Theater Ticket for ${title} ${titleAccent}`.trim()}
      >
        <div className={`relative flex-1 ${mainPad} overflow-hidden`}>
          {backdropUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backdropUrl}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 z-0 h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-card/95 via-card/90 to-card/85" />
            </>
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 to-card" />
          )}

          <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />

          <div className="relative z-10 flex h-full flex-col justify-between space-y-6">
            <div className="flex items-start justify-between">
              <Badge
                variant="outline"
                className="border-transparent bg-primary/10 text-primary"
              >
                <Star className="mr-1 h-3 w-3 fill-current" /> {badge}
              </Badge>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="Clakete"
                  className="h-8 w-auto opacity-90"
                />
              ) : (
                <Ticket className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <motion.h2
                className={`${titleSize} break-words font-serif font-bold tracking-wide text-card-foreground`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {title}
                {titleAccent ? (
                  <>
                    <br />
                    <span className="text-primary">{titleAccent}</span>
                  </>
                ) : null}
              </motion.h2>
              {venue ? (
                <p className="text-sm uppercase tracking-widest text-muted-foreground">
                  {venue}
                </p>
              ) : null}
            </div>

            <div
              className={`grid min-h-[3.75rem] gap-4 ${
                [dateValue, timeValue, seatValue].some(Boolean)
                  ? "border-t border-border pt-4"
                  : ""
              }`}
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  [dateValue, timeValue, seatValue].filter(Boolean).length,
                )}, minmax(0, 1fr))`,
              }}
            >
              {[
                { label: dateLabel, value: dateValue, Icon: Calendar },
                { label: timeLabel, value: timeValue, Icon: Star },
                { label: seatLabel, value: seatValue, Icon: MapPin },
              ]
                .filter((col) => Boolean(col.value))
                .map((col) => (
                  <div key={col.label}>
                    <p className="mb-1 text-xs uppercase text-muted-foreground">
                      {col.label}
                    </p>
                    <p className="flex items-center font-medium text-card-foreground">
                      <col.Icon className="mr-2 h-3 w-3 text-primary" />
                      {col.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div
          className={`relative ${vRipCls} w-8 flex-col items-center justify-center bg-card`}
        >
          <div className="absolute -top-3 z-20 h-6 w-6 rounded-full border-b border-border bg-background" />
          <div className="mx-auto h-full border-l-2 border-dashed border-border" />
          <div className="absolute -bottom-3 z-20 h-6 w-6 rounded-full border-t border-border bg-background" />
        </div>

        <div
          className={`relative ${hRipCls} h-8 w-full items-center justify-center bg-card`}
        >
          <div className="absolute -left-3 z-20 h-6 w-6 rounded-full border-r border-border bg-background" />
          <div className="my-auto w-full border-t-2 border-dashed border-border" />
          <div className="absolute -right-3 z-20 h-6 w-6 rounded-full border-l border-border bg-background" />
        </div>

        <motion.div
          className={`relative ${stubCls} flex flex-col items-center justify-center border-border bg-muted/50 p-6`}
          whileHover={bare ? undefined : { x: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div
            className={`flex ${barcodeCls} w-full justify-center opacity-70`}
            role="img"
            aria-label="Barcode"
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`bg-foreground ${i % 3 === 0 || i % 2 === 0 ? barThin : barThick}`}
              />
            ))}
          </div>
          <div className="mt-4 text-center">
            <p
              className={`origin-center whitespace-nowrap text-xs text-muted-foreground ${stubTextCls}`}
            >
              {stubText}
            </p>
          </div>
        </motion.div>
      </motion.div>
    );

    if (bare) return ticket;

    return (
      <div className="flex min-h-[400px] w-full items-center justify-center p-8">
        {ticket}
      </div>
    );
  },
);
