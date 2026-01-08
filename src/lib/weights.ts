/**
 * Weight normalization and calculation utilities
 */

export interface VideoWithWeight {
  weight: number
  [key: string]: any
}

/**
 * Normalizes weights to sum to 100%
 * @param videos Array of objects with weight property
 * @returns Array with normalized weights
 */
export function normalizeWeights<T extends VideoWithWeight>(videos: T[]): T[] {
  const total = videos.reduce((sum, v) => sum + (v.weight || 0), 0)
  if (total === 0) return videos
  return videos.map((v) => ({
    ...v,
    weight: Math.round((v.weight / total) * 100),
  }))
}

/**
 * Calculates the total weight percentage
 * @param videos Array of objects with weight property
 * @returns Total weight as a number
 */
export function calculateTotalWeight<T extends VideoWithWeight>(videos: T[]): number {
  return videos.reduce((sum, v) => sum + v.weight, 0)
}

/**
 * Checks if weights sum to exactly 100%
 * @param videos Array of objects with weight property
 * @returns True if total equals 100
 */
export function isTotalWeightValid<T extends VideoWithWeight>(videos: T[]): boolean {
  return calculateTotalWeight(videos) === 100
}

