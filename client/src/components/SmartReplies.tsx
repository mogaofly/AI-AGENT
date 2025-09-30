import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";

interface SmartRepliesProps {
  lastUserMessage: string;
  onReplySelect: (reply: string) => void;
  onDirectSend: (reply: string) => void;
}

export function SmartReplies({ lastUserMessage, onReplySelect, onDirectSend }: SmartRepliesProps) {
  const [replies, setReplies] = useState<string[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const { generateSmartReplies } = useChat();

  useEffect(() => {
    if (lastUserMessage) {
      generateSmartReplies(lastUserMessage)
        .then((newReplies) => {
          setReplies(newReplies);
          setShowReplies(true);
        })
        .catch(console.error);
    }
  }, [lastUserMessage, generateSmartReplies]);

  const handleReplyClick = (reply: string) => {
    onDirectSend(reply);
    setShowReplies(false);
  };

  if (!showReplies || replies.length === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-100">
      <div className="text-xs font-medium text-gray-600 mb-2">Smart Replies</div>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors relative"
            onClick={() => handleReplyClick(reply)}
            title={reply}
          >
            {reply.length > 30 ? `${reply.substring(0, 30)}...` : reply}
          </Button>
        ))}
      </div>
    </div>
  );
}
