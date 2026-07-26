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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("watch.unwatchConfirmTitle")}</DialogTitle>
          <DialogDescription>
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
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={disabled}
          >
            {disabled ? t("common.loading") : t("watch.unwatchConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
