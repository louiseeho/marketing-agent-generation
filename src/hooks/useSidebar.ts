import { useState, useEffect } from "react"

interface UseSidebarOptions {
  defaultWidth?: number
  manualModeWidth?: number
  automaticModeWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function useSidebar(
  isManualMode: boolean,
  options: UseSidebarOptions = {}
) {
  const {
    defaultWidth = 320,
    manualModeWidth = 500,
    automaticModeWidth = 320,
    minWidth = 200,
    maxWidth = 800,
  } = options

  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Auto-resize sidebar based on mode
  useEffect(() => {
    if (!isSidebarCollapsed) {
      if (isManualMode) {
        setSidebarWidth(manualModeWidth)
      } else {
        setSidebarWidth(automaticModeWidth)
      }
    }
  }, [isManualMode, isSidebarCollapsed, manualModeWidth, automaticModeWidth])

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, minWidth, maxWidth])

  const startResizing = () => {
    setIsResizing(true)
  }

  return {
    sidebarWidth,
    setSidebarWidth,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isResizing,
    startResizing,
  }
}

