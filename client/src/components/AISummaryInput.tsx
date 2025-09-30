import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

interface AISummaryInputProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function AISummaryInput({ isVisible, onDismiss }: AISummaryInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { messages, activeConversationId } = useChat();

  const generateSummary = async () => {
    if (!activeConversationId || messages.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${activeConversationId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setSummary(data.summary || "No summary available");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate summary when component becomes visible
  useEffect(() => {
    if (isVisible && !summary && !isLoading) {
      generateSummary();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse summary" : "Expand summary"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <span className="text-sm font-medium text-gray-700">AI Summary</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-5 h-5 p-0 text-gray-500 hover:text-gray-700"
          onClick={onDismiss}
          title="Dismiss summary"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {isExpanded && (
        <div className="text-sm text-gray-600 leading-relaxed">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span>Generating summary...</span>
            </div>
          ) : (
            <p>{summary}</p>
          )}
        </div>
      )}
    </div>
  );
}