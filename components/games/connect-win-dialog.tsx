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
import { useDesignMode } from "@/hooks/use-design-mode"
import { cn } from "@/lib/utils"

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
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  const share = async () => {
    const chain = path.map((n) => n.name).join(" → ")
    const text = `Connect the Stars no Clakete\n${originName} → ${targetName}\n${steps} ${steps === 1 ? "passo" : "passos"}\n${chain}\nhttps://clakete.xyz/games/connect-the-stars`
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
      <DialogContent className={cn("sm:max-w-lg", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[24px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        <DialogHeader>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>{t("games.winTitle")}</DialogTitle>
        </DialogHeader>

        <p className={cn("text-sm", isGlass ? "text-white/60" : "text-muted-foreground")}>
          {t("games.winBody", {
            steps: String(steps),
            from: originName,
            to: targetName,
          })}
        </p>

        <div className={cn("mt-2 flex max-h-48 flex-wrap justify-center gap-3 overflow-y-auto rounded-xl border p-3", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border bg-muted/30")}>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => void share()}
            className={cn(isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white")}
          >
            {t("games.share")}
          </Button>
          <Button
            type="button"
            className={cn(isGlass ? "rounded-xl bg-white px-5 font-semibold text-black hover:bg-white/90" : "bg-brand text-white hover:bg-brand-hover")}
            onClick={onPlayAgain}
          >
            {t("games.playAgain")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
