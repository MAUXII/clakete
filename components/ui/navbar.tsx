"use client"

import { useDesignMode } from "@/hooks/use-design-mode"
import { NavbarClassic } from "@/components/ui/navbar-classic"
import { NavbarGlass } from "@/components/ui/navbar-glass"

/** Picks Classic or Glass chrome from the viewer's `design_mode` preference. */
export function Navbar() {
  const designMode = useDesignMode()

  if (designMode === "glass") {
    return <NavbarGlass />
  }

  return <NavbarClassic />
}
