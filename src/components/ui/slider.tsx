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

  // Calculate percentage for the filled portion
  const min = typeof props.min === 'number' ? props.min : 0
  const max = typeof props.max === 'number' ? props.max : 100
  const currentValue = value ?? min
  const percentage = ((currentValue - min) / (max - min)) * 100

  return (
    <input
      type="range"
      data-slot="slider"
      value={value}
      onChange={handleChange}
      style={{
        background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${percentage}%, rgb(248, 250, 252) ${percentage}%, rgb(248, 250, 252) 100%)`
      }}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-lg slider-red-track",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Slider }

