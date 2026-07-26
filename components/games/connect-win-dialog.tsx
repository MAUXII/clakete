"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConnectNodeCard } from "@/components/games/connect-node-card"
import type { ConnectNode } from "@/lib/games/connect-the-stars"
import { useT } from "@/components/providers/i18n-provider"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  path: ConnectNode[]
  steps: number
  originName: string
  targetName: string
  onPlayAgain: () => void
}

export function ConnectWinDialog({
  open,
  onOpenChange,
  path,
  steps,
  originName,
  targetName,
  onPlayAgain,
}: Props) {
  const { t } = useT()

  const share = async () => {
    const chain = path.map((n) => n.name).join(" → ")
    const text = `Connect the Stars no Clakete\n${originName} → ${targetName}\n${steps} ${steps === 1 ? "passo" : "passos"}\n${chain}\nhttps://clakete.vercel.app/games/connect-the-stars`
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "Connect the Stars" })
        return
      }
      await navigator.clipboard.writeText(text)
      toast.success(t("games.copied"))
    } catch {
      /* user cancelled share */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("games.winTitle")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t("games.winBody", {
            steps: String(steps),
            from: originName,
            to: targetName,
          })}
        </p>

        <div className="mt-2 flex max-h-48 flex-wrap justify-center gap-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
          {path.map((node) => (
            <ConnectNodeCard
              key={`${node.kind}-${node.id}`}
              node={node}
              size="sm"
              asButton={false}
            />
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => void share()}>
            {t("games.share")}
          </Button>
          <Button
            type="button"
            className="bg-brand text-white hover:bg-brand-hover"
            onClick={onPlayAgain}
          >
            {t("games.playAgain")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
