import { useState, useEffect } from "react"
import { normalizeWeights, calculateTotalWeight, isTotalWeightValid } from "@/lib/weights"

export interface ManualVideo {
  url: string
  weight: number
}

const DEFAULT_VIDEO: ManualVideo = { url: "", weight: 100 }

export function useManualVideos(initialVideos: ManualVideo[] = [DEFAULT_VIDEO]) {
  const [manualVideos, setManualVideos] = useState<ManualVideo[]>(initialVideos)

  // Update weight for a specific video (no auto-normalization)
  const updateWeight = (index: number, newWeight: number) => {
    const updated = [...manualVideos]
    updated[index].weight = Math.max(0, Math.min(100, newWeight))
    setManualVideos(updated)
  }

  // Add a new video
  const addVideo = () => {
    const currentTotal = calculateTotalWeight(manualVideos)
    const newWeight = currentTotal > 0 
      ? Math.floor(100 / (manualVideos.length + 1)) 
      : 100 / (manualVideos.length + 1)
    
    const updated = manualVideos.map((v) => ({
      ...v,
      weight: Math.floor((v.weight / currentTotal) * (100 - newWeight)) || newWeight,
    }))
    updated.push({ url: "", weight: newWeight })
    setManualVideos(normalizeWeights(updated))
  }

  // Remove a video
  const removeVideo = (index: number) => {
    if (manualVideos.length <= 1) return // Keep at least 1 video
    const removed = manualVideos.filter((_, i) => i !== index)
    setManualVideos(normalizeWeights(removed))
  }

  // Update video URL
  const updateVideoUrl = (index: number, url: string) => {
    const updated = [...manualVideos]
    updated[index].url = url
    setManualVideos(updated)
  }

  // Ensure weights sum to 100% when videos are added/removed
  useEffect(() => {
    const total = calculateTotalWeight(manualVideos)
    if (total !== 100 && total > 0 && manualVideos.length > 0) {
      setManualVideos(normalizeWeights(manualVideos))
    }
  }, [manualVideos.length])

  const totalWeight = calculateTotalWeight(manualVideos)
  const isTotalValid = isTotalWeightValid(manualVideos)

  return {
    manualVideos,
    setManualVideos,
    updateWeight,
    addVideo,
    removeVideo,
    updateVideoUrl,
    totalWeight,
    isTotalValid,
  }
}

