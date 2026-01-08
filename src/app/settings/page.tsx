"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const [temperature, setTemperature] = useState(0.7)
  const [commentCount, setCommentCount] = useState(100)
  const [commentSort, setCommentSort] = useState("relevance")

  // Load temperature from localStorage on mount, default to 0.7
  useEffect(() => {
    const saved = localStorage.getItem("chatTemperature")
    if (saved !== null) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed)) {
        setTemperature(parsed)
      } else {
        setTemperature(0.7)
        localStorage.setItem("chatTemperature", "0.7")
      }
    } else {
      // No saved value, ensure default is set
      setTemperature(0.7)
      localStorage.setItem("chatTemperature", "0.7")
    }
  }, [])

  // Load comment count from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("commentCount")
    if (saved !== null) {
      setCommentCount(parseInt(saved))
    }
  }, [])

  // Load comment sort from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("commentSort")
    if (saved !== null) {
      setCommentSort(saved)
    }
  }, [])

  // Save temperature to localStorage when it changes
  const updateTemperature = (value: number) => {
    const clampedValue = Math.max(0, Math.min(2, value))
    setTemperature(clampedValue)
    localStorage.setItem("chatTemperature", clampedValue.toString())
  }

  // Save comment count to localStorage when it changes
  const updateCommentCount = (value: number) => {
    const clampedValue = Math.max(10, Math.min(500, value))
    setCommentCount(clampedValue)
    localStorage.setItem("commentCount", clampedValue.toString())
  }

  // Save comment sort to localStorage when it changes
  const updateCommentSort = (value: string) => {
    setCommentSort(value)
    localStorage.setItem("commentSort", value)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-red-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-6 h-4 bg-red-600 rounded-sm flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-1"></div>
            </div>
          </div>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-16">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Card className="p-8 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h2 className="text-2xl font-semibold">Settings</h2>
            </div>
            
            <div className="space-y-6">
              {/* Temperature Setting */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Response Temperature
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Controls the randomness and creativity of responses. Lower values (0-0.5) are more focused and deterministic, while higher values (1-2) are more creative and varied.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs text-muted-foreground">
                      Temperature: {temperature.toFixed(1)}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        updateTemperature(value)
                      }}
                      className="w-20 h-8 text-xs bg-background"
                    />
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onValueChange={(value) => updateTemperature(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

              {/* Comment Processing Setting */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Comment Processing
                  </Label>
                </div>
                
                {/* Number of Comments */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Number of Comments to Analyze
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Maximum number of comments to fetch and analyze from each video (default: 100)
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs text-muted-foreground">
                      Comments: {commentCount}
                    </Label>
                    <Input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      value={commentCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100
                        updateCommentCount(value)
                      }}
                      className="w-20 h-8 text-xs bg-background"
                    />
                  </div>
                  <Slider
                    min={10}
                    max={500}
                    step={10}
                    value={commentCount}
                    onValueChange={(value) => updateCommentCount(value)}
                    className="w-full"
                  />
                </div>

                {/* Comment Sorting */}
                <div className="space-y-3 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Comment Sorting
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      How comments are ordered when fetched from YouTube (default: relevance)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="commentSort"
                        value="relevance"
                        checked={commentSort === "relevance"}
                        onChange={(e) => updateCommentSort(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:ring-red-600 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Relevance</div>
                        <div className="text-xs text-muted-foreground">
                          Comments ordered by relevance to the video
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="commentSort"
                        value="time"
                        checked={commentSort === "time"}
                        onChange={(e) => updateCommentSort(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:ring-red-600 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Newest First</div>
                        <div className="text-xs text-muted-foreground">
                          Comments ordered by time (newest first)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

