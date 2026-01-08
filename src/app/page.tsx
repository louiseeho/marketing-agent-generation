"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Settings, Send, Bot, Loader2, Plus, X, ChevronLeft, ChevronRight, GripVertical } from "lucide-react"

export default function YouTubeAgentChat() {
  const [isManualMode, setIsManualMode] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default 320px (w-80)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [youtubeURL, setYoutubeURL] = useState("")
  const [manualVideos, setManualVideos] = useState([
    { url: "", weight: 50 },
    { url: "", weight: 50 },
  ])
  const [persona, setPersona] = useState(null)
  const [history, setHistory] = useState([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  // Normalize weights to sum to 100%
  const normalizeWeights = (videos) => {
    const total = videos.reduce((sum, v) => sum + (v.weight || 0), 0)
    if (total === 0) return videos
    return videos.map((v) => ({
      ...v,
      weight: Math.round((v.weight / total) * 100),
    }))
  }

  // Update weight for a specific video
  const updateWeight = (index, newWeight) => {
    const updated = [...manualVideos]
    updated[index].weight = Math.max(0, Math.min(100, newWeight))
    
    // Normalize all weights to sum to 100% if total is not 100
    const total = updated.reduce((sum, v) => sum + v.weight, 0)
    if (total !== 100 && total > 0) {
      // Normalize proportionally
      const normalized = normalizeWeights(updated)
      setManualVideos(normalized)
    } else {
      setManualVideos(updated)
    }
  }

  // Add a new video
  const addVideo = () => {
    const currentTotal = manualVideos.reduce((sum, v) => sum + v.weight, 0)
    const newWeight = currentTotal > 0 ? Math.floor(100 / (manualVideos.length + 1)) : 100 / (manualVideos.length + 1)
    const updated = manualVideos.map((v) => ({
      ...v,
      weight: Math.floor((v.weight / currentTotal) * (100 - newWeight)) || newWeight,
    }))
    updated.push({ url: "", weight: newWeight })
    setManualVideos(normalizeWeights(updated))
  }

  // Remove a video
  const removeVideo = (index) => {
    if (manualVideos.length <= 2) return // Keep at least 2 videos
    const removed = manualVideos.filter((_, i) => i !== index)
    setManualVideos(normalizeWeights(removed))
  }

  // Ensure weights sum to 100% when videos are added/removed
  useEffect(() => {
    const total = manualVideos.reduce((sum, v) => sum + v.weight, 0)
    if (total !== 100 && total > 0 && manualVideos.length > 0) {
      setManualVideos(normalizeWeights(manualVideos))
    }
  }, [manualVideos.length])

  // Auto-resize sidebar based on mode
  useEffect(() => {
    if (!isSidebarCollapsed) {
      if (isManualMode) {
        setSidebarWidth(500) // Larger for manual mode
      } else {
        setSidebarWidth(320) // Smaller for automatic mode
      }
    }
  }, [isManualMode, isSidebarCollapsed])

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      const minWidth = 200
      const maxWidth = 800
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
  }, [isResizing])

  const handleGenerateAgent = async (e) => {
    e.preventDefault()

    if (isManualMode) {
      // Manual mode: validate all videos and weights
      const validVideos = manualVideos.filter((v) => extractVideoId(v.url))
      if (validVideos.length === 0) {
        return alert("Please enter at least one valid YouTube URL")
      }
      
      // Normalize weights for valid videos only
      const totalWeight = validVideos.reduce((sum, v) => sum + v.weight, 0)
      if (totalWeight === 0) {
        return alert("Please set weights for at least one video")
      }
      
      // Normalize weights to sum to 100%
      const normalizedVideos = normalizeWeights(validVideos)

      setLoading(true)
      try {
        const videos = normalizedVideos.map((v) => ({
          videoId: extractVideoId(v.url),
          weight: v.weight,
        }))
        
        const res = await fetch("/generate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "manual", videos }),
        })
        const data = await res.json()
        if (data.error) {
          alert(data.error)
          return
        }
        console.log("Generated agent:", data)
        setPersona(data.agent)
        setHistory([])
      } catch (err) {
        alert("Error generating agent")
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      // Automatic mode
      const videoId = extractVideoId(youtubeURL)
      if (!videoId) return alert("Invalid YouTube URL")

      setLoading(true)
      try {
        const res = await fetch("/generate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "automatic", videoId }),
        })
        const data = await res.json()
        if (data.error) {
          alert(data.error)
          return
        }
        console.log("Generated agent:", data)
        setPersona(data.agent)
        setHistory([])
      } catch (err) {
        alert("Error generating agent")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const newHistory = [...history, [userInput, ""]]
    setHistory(newHistory)
    setUserInput("")
    setGenerating(true)

    try {
      const res = await fetch("/chat-with-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, history: newHistory }),
      })
      const data = await res.json()
      newHistory[newHistory.length - 1][1] = data.reply
      setHistory([...newHistory])
    } catch (err) {
      console.error("Chat error:", err)
      alert("Agent failed to reply.")
    } finally {
      setGenerating(false)
    }
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
          <h1 className="text-lg font-semibold">YouTube Agent Chat</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-16">
        {/* Left Sidebar */}
        {!isSidebarCollapsed && (
          <div
            className="bg-muted/30 border-r border-border overflow-y-auto transition-all duration-200 relative"
            style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
          >
            <div className="p-6">
            <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Generate AI Agent</h2>
            
            {/* Mode Selection */}
            <div className="mb-4 pb-4 border-b border-border">
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                Mode
              </Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="automatic"
                    checked={!isManualMode}
                    onChange={() => setIsManualMode(false)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Automatic Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically find related videos
                    </div>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="manual"
                    checked={isManualMode}
                    onChange={() => setIsManualMode(true)}
                    className="w-4 h-4 text-red-600 focus:ring-red-600 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Manual Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Enter video URLs and set weights manually
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <form onSubmit={handleGenerateAgent} className="space-y-4">
              {isManualMode ? (
                <>
                  {/* Manual Mode */}
                  <div className="space-y-4">
                    {manualVideos.map((video, index) => (
                      <div key={index} className="space-y-3 p-3 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Video {index + 1}
                          </Label>
                          {manualVideos.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeVideo(index)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={video.url}
                          onChange={(e) => {
                            const updated = [...manualVideos]
                            updated[index].url = e.target.value
                            setManualVideos(updated)
                          }}
                          className="bg-background"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Weight: {video.weight}%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={video.weight}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                updateWeight(index, value)
                              }}
                              className="w-16 h-7 text-xs bg-background"
                            />
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            value={video.weight}
                            onValueChange={(value) => updateWeight(index, value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVideo}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      Total: {manualVideos.reduce((sum, v) => sum + v.weight, 0)}%
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Automatic Mode */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      YouTube URL
                    </Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={youtubeURL}
                      onChange={(e) => setYoutubeURL(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={
                  loading ||
                  (isManualMode
                    ? manualVideos.every((v) => !v.url.trim())
                    : !youtubeURL.trim())
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate Agent
                  </>
                )}
              </Button>
            </form>

            {persona && (
              <div className="mt-6 p-4 bg-card rounded-lg border">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Generated Agent</h3>
                <div className="space-y-2">
                  <p className="font-medium">{persona.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Age:</strong> {persona.age}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tone:</strong> {persona.tone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Interests:</strong> {persona.interests.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </Card>
            </div>
          </div>
        )}

        {/* Resize Handle */}
        {!isSidebarCollapsed && (
          <div
            className="w-1 bg-border hover:bg-red-600 cursor-col-resize transition-colors relative group"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center">
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {/* Collapse/Expand Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed z-20 bg-background border border-border shadow-sm hover:bg-muted transition-all top-20"
          style={{
            left: isSidebarCollapsed ? "8px" : `${sidebarWidth - 12}px`,
            transform: isSidebarCollapsed ? "none" : "translateX(-50%)",
          }}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Chat with Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {persona ? `Chatting with ${persona.name}` : "Generate an agent to start chatting"}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {persona
                      ? "Start a conversation with your YouTube agent!"
                      : "No agent generated yet. Paste a YouTube URL and click 'Generate Agent' to start chatting!"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(([user, bot], i) => (
                  <div key={i} className="space-y-3">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[70%] bg-red-600 text-white rounded-lg px-4 py-2">
                        <p className="text-sm font-medium mb-1">You</p>
                        <p>{user}</p>
                      </div>
                    </div>
                    {/* Agent message */}
                    {bot && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-card border rounded-lg px-4 py-2">
                          <p className="text-sm font-medium mb-1 text-muted-foreground">{persona?.name || "Agent"}</p>
                          <p>{bot}</p>
                        </div>
                      </div>
                    )}
                    {/* Loading indicator for generating response */}
                    {!bot && generating && i === history.length - 1 && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] bg-card border rounded-lg px-4 py-2">
                          <p className="text-sm font-medium mb-1 text-muted-foreground">{persona?.name || "Agent"}</p>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-border">
            <form onSubmit={handleChat} className="flex gap-2">
              <Input
                placeholder={persona ? "Type your message..." : "Generate an agent to chat"}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!persona || generating}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!persona || !userInput.trim() || generating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}