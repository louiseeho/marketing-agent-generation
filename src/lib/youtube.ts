/**
 * YouTube utility functions
 */

/**
 * Extracts the video ID from a YouTube URL
 * Supports formats:
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

