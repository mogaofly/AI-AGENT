import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

interface SmartSuggestionsProps {
  lastUserMessage: string;
  onInsertSuggestion: (suggestion: string) => void;
}

export function SmartSuggestions({ lastUserMessage, onInsertSuggestion }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editableText, setEditableText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { generateSmartSuggestions } = useChat();

  useEffect(() => {
    if (lastUserMessage) {
      generateSmartSuggestions(lastUserMessage)
        .then((newSuggestions) => {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
        })
        .catch(console.error);
    }
  }, [lastUserMessage, generateSmartSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    onInsertSuggestion(suggestion);
    setShowSuggestions(false);
  };

  const handleInsert = () => {
    onInsertSuggestion(editableText);
    setShowModal(false);
    setShowSuggestions(false);
  };

  const handleRewrite = async () => {
    try {
      const response = await fetch('/api/smart-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `Rewrite this text to be more professional and clear: "${editableText}"` 
        }),
      });
      const data = await response.json();
      if (data.suggestion) {
        setEditableText(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to rewrite text:", error);
    }
  };

  const handlePolish = async () => {
    try {
      const response = await fetch('/api/smart-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `Polish and improve the grammar and tone of this text: "${editableText}"` 
        }),
      });
      const data = await response.json();
      if (data.suggestion) {
        setEditableText(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to polish text:", error);
    }
  };

  const handleRegenerate = async () => {
    try {
      const newSuggestions = await generateSmartSuggestions(lastUserMessage);
      setSuggestions(newSuggestions);
      if (newSuggestions.length > 0) {
        setSelectedSuggestion(newSuggestions[0]);
      }
    } catch (error) {
      console.error("Failed to regenerate suggestions:", error);
    }
  };

  if (!showSuggestions || suggestions.length === 0) return null;

  return (
    <>
      <div className="absolute bottom-3 left-4 right-16 z-10 pointer-events-auto">
        <div className="flex flex-wrap gap-1">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              title={suggestion} // Tooltip on hover
              className="text-xs px-2 py-1 h-6 border-gray-300 bg-white/95 backdrop-blur-sm hover:border-talkdesk-400 hover:bg-talkdesk-50 transition-colors max-w-32 truncate shadow-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.length > 15 ? suggestion.substring(0, 15) + '...' : suggestion}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="fixed bottom-20 left-4 right-4 max-w-none w-auto transform-none translate-x-0 translate-y-0 top-auto mx-0" style={{ width: 'calc(100% - 32px)', maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Suggestion</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="relative">
              <Textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                placeholder="Edit your suggestion..."
                className="w-full min-h-20 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                rows={3}
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRewrite}
                  className="h-7 w-7 p-1 hover:bg-gray-100"
                  title="Rewrite"
                >
                  <Wand2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePolish}
                  className="h-7 w-7 p-1 hover:bg-gray-100"
                  title="Polish"
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Discard
            </Button>
            <Button size="sm" onClick={handleInsert} className="bg-blue-600 hover:bg-blue-700">
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
