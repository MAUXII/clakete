"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/components/providers/i18n-provider"
import { useDesignMode } from "@/hooks/use-design-mode"
import { cn } from "@/lib/utils"

interface ConfirmUnwatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmUnwatchDialog({
  open,
  onOpenChange,
  title,
  loading = false,
  onConfirm,
}: ConfirmUnwatchDialogProps) {
  const { t } = useT()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  const disabled = loading || busy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", isGlass && "border-white/10 sm:rounded-[20px]")}>
        <DialogHeader>
          <DialogTitle>{t("watch.unwatchConfirmTitle")}</DialogTitle>
          <DialogDescription className={cn(isGlass && "text-white/50")}>
            {title
              ? t("watch.unwatchConfirmBody", { title })
              : t("watch.unwatchConfirmBodyGeneric")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
            className={cn(isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white")}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={disabled}
            className={cn(isGlass && "rounded-xl")}
          >
            {disabled ? t("common.loading") : t("watch.unwatchConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
