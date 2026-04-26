import { Icon } from "@iconify/react"
import type { ComponentProps } from "react"

type AppIconProps = ComponentProps<typeof Icon> & {
  icon: string
  className?: string
}

export function AppIcon({ icon, className, ...props }: AppIconProps) {
  return <Icon icon={icon} className={className} aria-hidden="true" {...props} />
}
