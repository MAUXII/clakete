"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Star, Ticket } from "lucide-react";

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
}

export function TheaterTicket({
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
}: TheaterTicketProps = {}) {
  const horiz = orientation === "horizontal";
  const vert = orientation === "vertical";

  // Layout classes driven by orientation. "responsive" keeps the original
  // md:-breakpoint behavior (vertical on mobile, horizontal on desktop).
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

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        className={`group relative flex w-full max-w-2xl min-h-[280px] ${containerDir} overflow-hidden rounded-xl bg-card border border-border shadow-2xl`}
        role="article"
        aria-label={`Theater Ticket for ${title} ${titleAccent}`.trim()}
      >
        {/* Main Ticket Section */}
        <div className={`relative flex-1 ${mainPad} overflow-hidden`}>
          {/* Backdrop image (optional) + readability overlay */}
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
            /* Gradient Background */
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-card z-0" />
          )}

          {/* Background Texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay z-0" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex justify-between items-start">
              <Badge
                variant="outline"
                className="border-transparent text-primary bg-primary/10"
              >
                <Star className="w-3 h-3 mr-1 fill-current" /> {badge}
              </Badge>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="Clakete"
                  className="h-8 w-auto opacity-90"
                />
              ) : (
                <Ticket className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <motion.h2
                className={`${titleSize} font-serif font-bold text-card-foreground tracking-wide`}
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
                <p className="text-muted-foreground text-sm tracking-widest uppercase">
                  {venue}
                </p>
              ) : null}
            </div>

            {/* Meta row: keep height so the ticket doesn't collapse; divider only when there's data. */}
            <div
              className={`grid gap-4 min-h-[3.75rem] ${
                [dateValue, timeValue, seatValue].some(Boolean)
                  ? "pt-4 border-t border-border"
                  : ""
              }`}
              style={{
                gridTemplateColumns: `repeat(${
                  Math.max(
                    1,
                    [dateValue, timeValue, seatValue].filter(Boolean).length,
                  )
                }, minmax(0, 1fr))`,
              }}
            >
              {[
                { label: dateLabel, value: dateValue, Icon: Calendar },
                { label: timeLabel, value: timeValue, Icon: Clock },
                { label: seatLabel, value: seatValue, Icon: MapPin },
              ]
                .filter((col) => Boolean(col.value))
                .map((col) => (
                  <div key={col.label}>
                    <p className="text-xs text-muted-foreground uppercase mb-1">
                      {col.label}
                    </p>
                    <p className="text-card-foreground font-medium flex items-center">
                      <col.Icon className="w-3 h-3 mr-2 text-primary" />
                      {col.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Rip Line (horizontal layout) */}
        <div className={`relative ${vRipCls} w-8 flex-col items-center justify-center bg-card`}>
          <div className="absolute -top-3 w-6 h-6 rounded-full bg-background z-20 border-b border-border" />
          <div className="h-full border-l-2 border-dashed border-border mx-auto" />
          <div className="absolute -bottom-3 w-6 h-6 rounded-full bg-background z-20 border-t border-border" />
        </div>

        {/* Rip Line (vertical layout) */}
        <div className={`relative ${hRipCls} h-8 w-full items-center justify-center bg-card`}>
          <div className="absolute -left-3 h-6 w-6 rounded-full bg-background z-20 border-r border-border" />
          <div className="w-full border-t-2 border-dashed border-border my-auto" />
          <div className="absolute -right-3 h-6 w-6 rounded-full bg-background z-20 border-l border-border" />
        </div>

        {/* Ticket Stub */}
        <motion.div
          className={`relative ${stubCls} bg-muted/50 p-6 flex flex-col items-center justify-center border-border`}
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Barcode Lines */}
          <div
            className={`flex ${barcodeCls} justify-center w-full opacity-70`}
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
            <p className={`text-xs text-muted-foreground origin-center whitespace-nowrap ${stubTextCls}`}>
              {stubText}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
