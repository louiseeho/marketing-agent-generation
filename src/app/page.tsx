"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Settings, Send, Bot, Loader2, Plus, X, ChevronLeft, ChevronRight, GripVertical, AlertTriangle, Download } from "lucide-react"
import Link from "next/link"
import { extractVideoId } from "@/lib/youtube"
import { normalizeWeights } from "@/lib/weights"
import { useSidebar } from "@/hooks/useSidebar"
import { useManualVideos } from "@/hooks/useManualVideos"

type Persona = { name: string; age: string | number; tone: string; interests: string[]; sampleComment?: string }
type HistoryTurn = [user: string, bot: string | null]

export default function YouTubeAgentChat() {
  const [isManualMode, setIsManualMode] = useState(false)
  const [youtubeURL, setYoutubeURL] = useState("")
  const [persona, setPersona] = useState<Persona | null>(null)
  const [history, setHistory] = useState<HistoryTurn[]>([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Listen for clear history event from settings page
  useEffect(() => {
    const handleClearHistory = () => {
      setHistory([])
    }
    window.addEventListener("clearChatHistory", handleClearHistory)
    return () => window.removeEventListener("clearChatHistory", handleClearHistory)
  }, [])

  // Sidebar management hook
  const {
    sidebarWidth,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    startResizing,
  } = useSidebar(isManualMode)

  // Manual videos management hook
  const {
    manualVideos,
    updateWeight,
    addVideo,
    removeVideo,
    updateVideoUrl,
    totalWeight,
    isTotalValid,
  } = useManualVideos([{ url: "", weight: 100 }])

  const handleGenerateAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isManualMode) {
      // Manual mode: validate all videos and weights
      const validVideos = manualVideos.filter((v) => extractVideoId(v.url))
      if (validVideos.length === 0) {
        return alert("Please enter at least one valid YouTube URL")
      }
      
      // Normalize weights for valid videos only
      const validTotalWeight = validVideos.reduce((sum, v) => sum + v.weight, 0)
      if (validTotalWeight === 0) {
        return alert("Please set weights for at least one video")
      }
      
      // Normalize weights to sum to 100%
      const normalizedVideos = normalizeWeights(validVideos)

      setLoading(true)
      try {
        // Get comment processing settings from localStorage
        const savedCommentCount = localStorage.getItem("commentCount")
        const savedCommentSort = localStorage.getItem("commentSort")
        const commentCount = savedCommentCount ? parseInt(savedCommentCount) : 100
        const commentSort = savedCommentSort || "relevance"

        const videos = normalizedVideos.map((v) => ({
          videoId: extractVideoId(v.url),
          weight: v.weight,
        }))
        
        const res = await fetch("/generate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "manual", videos, commentCount, commentSort }),
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
        // Get comment processing settings from localStorage
        const savedCommentCount = localStorage.getItem("commentCount")
        const savedCommentSort = localStorage.getItem("commentSort")
        const commentCount = savedCommentCount ? parseInt(savedCommentCount) : 100
        const commentSort = savedCommentSort || "relevance"

        // Get automatic mode settings from localStorage
        const savedRelatedVideosCount = localStorage.getItem("relatedVideosCount")
        const savedKeywordSensitivity = localStorage.getItem("keywordSensitivity")
        const relatedVideosCount = savedRelatedVideosCount ? parseInt(savedRelatedVideosCount) : 5
        const keywordSensitivity = savedKeywordSensitivity ? parseInt(savedKeywordSensitivity) : 50

        const res = await fetch("/generate-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mode: "automatic", 
            videoId, 
            commentCount, 
            commentSort,
            relatedVideosCount,
            keywordSensitivity,
          }),
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

  const handleChat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const newHistory: HistoryTurn[] = [...history, [userInput, ""]]
    setHistory(newHistory)
    setUserInput("")
    setGenerating(true)

    try {
      // Get settings from localStorage
      const savedTemperature = localStorage.getItem("chatTemperature")
      const temperature = savedTemperature ? parseFloat(savedTemperature) : 0.7
      
      const savedResponseStyle = localStorage.getItem("responseStyle") || "casual"
      const savedHistoryLimit = localStorage.getItem("conversationHistory")
      const historyLimit = savedHistoryLimit ? parseInt(savedHistoryLimit) : 10
      
      const savedMaxResponseLength = localStorage.getItem("maxResponseLength")
      const maxResponseLength = savedMaxResponseLength ? parseInt(savedMaxResponseLength) : 1024
      
      // Limit history to the specified number of messages
      const limitedHistory = newHistory.slice(-historyLimit)
      
      const res = await fetch("/chat-with-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          persona, 
          history: limitedHistory, 
          temperature,
          responseStyle: savedResponseStyle,
          maxResponseLength,
        }),
      })
      const data = await res.json()
      newHistory[newHistory.length - 1][1] = data.reply
      setHistory([...newHistory] as HistoryTurn[])
    } catch (err) {
      console.error("Chat error:", err)
      alert("Agent failed to reply.")
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPersona = () => {
    if (!persona) return

    // Create a clean JSON object with the persona data
    const personaData = {
      name: persona.name,
      age: persona.age,
      tone: persona.tone,
      interests: persona.interests,
      ...(persona.sampleComment && { sampleComment: persona.sampleComment }),
      exportedAt: new Date().toISOString(),
    }

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(personaData, null, 2)
    
    // Create a blob and download
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `persona-${persona.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        <Link href="/settings">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-red-700"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-16">
        {/* Collapsed Sidebar Rail */}
        <div
          className={`w-12 bg-muted/30 border-r border-border flex flex-col items-center pt-4 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${
            isSidebarCollapsed
              ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            className="hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Left Sidebar */}
        <div
          className={`bg-muted/30 border-r border-border overflow-y-auto relative hide-scrollbar transition-all duration-300 ease-in-out ${
            isSidebarCollapsed
              ? "-translate-x-full opacity-0 pointer-events-none"
              : "translate-x-0 opacity-100"
          }`}
          style={{
            width: isSidebarCollapsed ? "0px" : `${sidebarWidth}px`,
            minWidth: isSidebarCollapsed ? "0px" : `${sidebarWidth}px`,
          }}
        >
            <div className="p-6">
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Generate AI Agent</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(true)}
                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            
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
                    className="w-4 h-4 text-red-600 focus:outline-none"
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
                    className="w-4 h-4 text-red-600 focus:outline-none"
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
                          {manualVideos.length > 1 && (
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
                          onChange={(e) => updateVideoUrl(index, e.target.value)}
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
                    <div className="flex items-center justify-center gap-2 text-xs pt-2">
                      <span className={isTotalValid ? "text-muted-foreground" : "text-red-600"}>
                        Total: {totalWeight}%
                      </span>
                      {!isTotalValid && (
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                      )}
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
                className={`w-full text-white ${
                  isManualMode && !isTotalValid
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={
                  loading ||
                  (isManualMode
                    ? manualVideos.every((v) => !v.url.trim())
                    : !youtubeURL.trim())
                }
                title={
                  isManualMode && !isTotalValid
                    ? "Percentages must sum to 100% (will be auto-balanced on submit)"
                    : undefined
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {isManualMode && !isTotalValid ? (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Generate Agent ({totalWeight}%)
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Generate Agent
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            {persona && (
              <div className="mt-6 p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Generated Agent</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPersona}
                    className="h-7 px-2 text-xs"
                    title="Export persona as JSON"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
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

        {/* Resize Handle */}
        {!isSidebarCollapsed && (
          <div
            className="w-1 bg-border hover:bg-red-600 cursor-col-resize transition-colors relative group"
            onMouseDown={(e) => {
              e.preventDefault()
              startResizing()
            }}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center">
              <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

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