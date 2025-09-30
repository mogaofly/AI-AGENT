import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Minus, Plus, Send, Paperclip, Smile } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

export function FloatingChatWidget() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage } = useChat();

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue, false);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show all messages in the widget (both customer and agent messages)
  const widgetMessages = messages;

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
      style={{ width: '364px', height: '680px' }}
    >
      {/* Widget Header */}
      <div className="bg-talkdesk-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">Talkdesk</div>
              <div className="text-xs text-talkdesk-100">Powered by Talkdesk</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 hover:bg-white hover:bg-opacity-20 rounded transition-colors flex items-center justify-center text-white"
          >
            {isMinimized ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Widget Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {widgetMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 mb-4 ${!message.isAgent ? 'justify-end' : ''}`}
              >
                {message.isAgent && (
                  <div className="w-8 h-8 bg-talkdesk-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`flex-1 ${!message.isAgent ? 'flex justify-end' : ''}`}>
                  <div
                    className={`rounded-lg p-3 shadow-sm max-w-xs ${
                      message.isAgent
                        ? 'bg-white text-gray-800'
                        : 'bg-talkdesk-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.isAgent ? 'Agent' : 'You'} •{' '}
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Now'}
                  </div>
                </div>
                {!message.isAgent && (
                  <div className="w-8 h-8 bg-talkdesk-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">HH</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Widget Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-talkdesk-500 focus:border-transparent"
                style={{ width: '260px' }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                className="w-8 h-8 bg-talkdesk-500 text-white rounded-full hover:bg-talkdesk-600 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
