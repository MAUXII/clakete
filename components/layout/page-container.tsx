import type { ElementType, ReactNode } from "react"
import { pageContainerClass } from "@/lib/page-container"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

export function PageContainer({
  children,
  className,
  as: Tag = "div",
}: PageContainerProps) {
  return <Tag className={cn(pageContainerClass, className)}>{children}</Tag>
}
