import * as React from "react"

import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.ComponentProps<"input">, "type"> {
  value?: number
  onValueChange?: (value: number) => void
}

function Slider({ className, value, onValueChange, onChange, ...props }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    onValueChange?.(newValue)
    onChange?.(e)
  }

  return (
    <input
      type="range"
      data-slot="slider"
      value={value}
      onChange={handleChange}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-red-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Slider }

