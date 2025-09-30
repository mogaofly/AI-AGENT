import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, X, RotateCcw } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

export function AISummary() {
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateSummary } = useChat();

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const newSummary = await generateSummary();
      setSummary(newSummary);
      setShowSummary(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const newSummary = await generateSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error("Failed to regenerate summary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerateSummary}
        disabled={isGenerating}
        className="flex items-center space-x-2"
      >
        <Bot className="h-4 w-4 text-talkdesk-500" />
        <span>{isGenerating ? "Generating..." : "Summarize"}</span>
      </Button>

      {showSummary && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  AI Conversation Summary
                </div>
                <div className="text-sm text-blue-800">{summary}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="text-xs text-blue-600 hover:text-blue-800 border-blue-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
