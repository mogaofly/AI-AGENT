import { useState, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";

interface SmartComposeProps {
  inputValue: string;
  onSuggestionAccept: (suggestion: string) => void;
  isUserTyping?: boolean;
  showSlashCommands?: boolean;
}

export function SmartCompose({ inputValue, onSuggestionAccept, isUserTyping = true, showSlashCommands = false }: SmartComposeProps) {
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const { generateSmartCompose } = useChat();

  useEffect(() => {
    // Only show smart compose when user is actively typing (not when suggestions are inserted) and slash commands are not showing
    if (inputValue.length > 2 && isUserTyping && !showSlashCommands && !inputValue.endsWith('/')) {
      const timeoutId = setTimeout(async () => {
        try {
          const smartSuggestion = await generateSmartCompose(inputValue);
          if (smartSuggestion) {
            // Extract the continuation part after the input
            let suggestionText = smartSuggestion;
            
            // If suggestion starts with input, show only the remaining part
            if (smartSuggestion.toLowerCase().startsWith(inputValue.toLowerCase())) {
              suggestionText = smartSuggestion.substring(inputValue.length);
            } else {
              // If it's a complete response, try to find a natural continuation point
              const sentences = smartSuggestion.split(/[.!?]/);
              if (sentences.length > 0) {
                suggestionText = sentences[0].trim();
                // Remove any quotes at the beginning
                suggestionText = suggestionText.replace(/^["']/, '');
                // If it doesn't start naturally, add a space
                if (!suggestionText.startsWith(' ')) {
                  suggestionText = ' ' + suggestionText;
                }
              }
            }
            
            setSuggestion(suggestionText);
            setShowSuggestion(true);
          } else {
            setShowSuggestion(false);
          }
        } catch (error) {
          console.error("Failed to generate smart compose:", error);
          setShowSuggestion(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestion(false);
      setSuggestion("");
    }
  }, [inputValue, generateSmartCompose, isUserTyping, showSlashCommands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && showSuggestion && suggestion) {
        e.preventDefault();
        // Accept the full suggestion by combining input with suggestion
        const fullText = inputValue + suggestion;
        onSuggestionAccept(fullText);
        setShowSuggestion(false);
        setSuggestion("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestion, suggestion, onSuggestionAccept, inputValue]);

  if (!showSuggestion) return null;

  return (
    <div className="absolute inset-0 flex items-start pt-3 px-4 pointer-events-none z-5">
      <div className="flex whitespace-pre-wrap text-sm leading-normal">
        <span className="invisible">{inputValue}</span>
        <span className="text-gray-400">{suggestion}</span>
      </div>
    </div>
  );
}
