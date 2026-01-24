"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const [temperature, setTemperature] = useState(0.7)
  const [commentCount, setCommentCount] = useState(100)
  const [commentSort, setCommentSort] = useState("relevance")
  const [responseStyle, setResponseStyle] = useState("casual")
  const [conversationHistory, setConversationHistory] = useState(10)
  const [maxResponseLength, setMaxResponseLength] = useState(1024)

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

  // Load response style from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("responseStyle")
    if (saved !== null) {
      setResponseStyle(saved)
    }
  }, [])

  // Load conversation history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("conversationHistory")
    if (saved !== null) {
      const parsed = parseInt(saved)
      if (!isNaN(parsed)) {
        setConversationHistory(parsed)
      }
    }
  }, [])

  // Load max response length from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("maxResponseLength")
    if (saved !== null) {
      const parsed = parseInt(saved)
      if (!isNaN(parsed)) {
        setMaxResponseLength(parsed)
      }
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

  // Save response style to localStorage when it changes
  const updateResponseStyle = (value: string) => {
    setResponseStyle(value)
    localStorage.setItem("responseStyle", value)
  }

  // Save conversation history to localStorage when it changes
  const updateConversationHistory = (value: number) => {
    const clampedValue = Math.max(1, Math.min(50, value))
    setConversationHistory(clampedValue)
    localStorage.setItem("conversationHistory", clampedValue.toString())
  }

  // Save max response length to localStorage when it changes
  const updateMaxResponseLength = (value: number) => {
    const clampedValue = Math.max(50, Math.min(2048, value))
    setMaxResponseLength(clampedValue)
    localStorage.setItem("maxResponseLength", clampedValue.toString())
  }

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear the chat history? This action cannot be undone.")) {
      // Dispatch a custom event that the main page can listen to
      window.dispatchEvent(new CustomEvent("clearChatHistory"))
      alert("Chat history will be cleared when you return to the main page.")
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
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full pt-[4.5rem] pb-8 overflow-y-auto">
        <div className="flex-1 flex flex-col items-start p-6 min-h-0 w-full">
          <div className="w-full max-w-2xl mx-auto">
            <Card className="p-8 w-full mb-6">
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
                        className="w-4 h-4 text-red-600 focus:outline-none"
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
                        className="w-4 h-4 text-red-600 focus:outline-none"
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

              {/* Chat Experience Setting */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Chat Experience
                  </Label>
                </div>

                {/* Response Style */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Response Style
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Choose how the agent responds to your messages (default: casual)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="responseStyle"
                        value="casual"
                        checked={responseStyle === "casual"}
                        onChange={(e) => updateResponseStyle(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Casual</div>
                        <div className="text-xs text-muted-foreground">
                          Informal, friendly, like talking to a friend
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="responseStyle"
                        value="formal"
                        checked={responseStyle === "formal"}
                        onChange={(e) => updateResponseStyle(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Formal</div>
                        <div className="text-xs text-muted-foreground">
                          Professional and polite tone
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="responseStyle"
                        value="emoji-heavy"
                        checked={responseStyle === "emoji-heavy"}
                        onChange={(e) => updateResponseStyle(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Emoji-Heavy</div>
                        <div className="text-xs text-muted-foreground">
                          Uses lots of emojis and expressive language
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="responseStyle"
                        value="concise"
                        checked={responseStyle === "concise"}
                        onChange={(e) => updateResponseStyle(e.target.value)}
                        className="w-4 h-4 text-red-600 focus:outline-none"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Concise</div>
                        <div className="text-xs text-muted-foreground">
                          Short, to-the-point responses
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-3 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Conversation History
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Number of previous messages the agent remembers (default: 10, max: 50)
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs text-muted-foreground">
                      Messages: {conversationHistory}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      value={conversationHistory}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 10
                        updateConversationHistory(value)
                      }}
                      className="w-20 h-8 text-xs bg-background"
                    />
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={conversationHistory}
                    onValueChange={(value) => updateConversationHistory(value)}
                    className="w-full"
                  />
                </div>

                {/* Max Response Length */}
                <div className="space-y-3 pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Max Response Length
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Maximum length of agent responses in tokens. Lower values create shorter responses, higher values allow longer, more detailed responses (default: 1024, max: 2048)
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs text-muted-foreground">
                      Tokens: {maxResponseLength}
                    </Label>
                    <Input
                      type="number"
                      min="50"
                      max="2048"
                      step="50"
                      value={maxResponseLength}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1024
                        updateMaxResponseLength(value)
                      }}
                      className="w-20 h-8 text-xs bg-background"
                    />
                  </div>
                  <Slider
                    min={50}
                    max={2048}
                    step={50}
                    value={maxResponseLength}
                    onValueChange={(value) => updateMaxResponseLength(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Short (50)</span>
                    <span>Medium (1024)</span>
                    <span>Long (2048)</span>
                  </div>
                </div>

                {/* Clear History */}
                <div className="pt-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Clear Chat History
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete all chat history. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearHistory}
                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Chat History
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

