import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, FileText, MoreHorizontal, ExternalLink, Sparkles, Languages, FileCheck } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { SmartCompose } from "./SmartCompose";
import { SmartSuggestions } from "./SmartSuggestions";
import { SmartReplies } from "./SmartReplies";
import { AISummary } from "./AISummary";
import { AISummaryInput } from "./AISummaryInput";
import { TemplateModal } from "./TemplateModal";
import { SlashCommands } from "./SlashCommands";

export function ConversationWindow() {
  const [inputValue, setInputValue] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, activeConversationId } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue, true);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!showSlashCommands) {
        handleSendMessage();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsUserTyping(true); // User is actively typing
    
    // Show slash commands if input ends with '/'
    if (value.endsWith('/')) {
      setShowSlashCommands(true);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleSlashCommandSelect = (content: string) => {
    // Replace the trailing '/' with the selected command
    const newValue = inputValue.slice(0, -1) + content;
    setInputValue(newValue);
    setIsUserTyping(false); // This is an automatic insertion, not user typing
    setShowSlashCommands(false);
  };

  const handleSuggestionAccept = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleInsertSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setIsUserTyping(false); // This is an automatic insertion, not user typing
  };

  const handleReplySelect = (reply: string) => {
    setInputValue(reply);
  };

  const handleDirectSend = async (reply: string) => {
    if (!activeConversationId || !reply.trim()) return;
    
    try {
      await sendMessage(reply, true);
      setInputValue("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setInputValue(content);
    setIsUserTyping(false); // This is an automatic insertion, not user typing
  };

  const handleSummaryClick = () => {
    setShowSummary(true);
  };

  const handleSummaryDismiss = () => {
    setShowSummary(false);
  };

  const lastUserMessage = messages.filter(m => !m.isAgent).slice(-1)[0]?.text || "";

  return (
    <div className="flex h-full overflow-hidden w-full bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-talkdesk-500 rounded-lg flex items-center justify-center">
              <Send className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Talkdesk</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Conversations</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Assigned to you</span>
              <span className="text-xs text-gray-400">Inbox</span>
            </div>
            <div className="text-sm text-gray-600">1 conversation</div>
          </div>

          {/* Chat Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Chat</h3>
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-talkdesk-50 border border-talkdesk-200 mb-2 cursor-pointer">
              <div className="w-8 h-8 bg-talkdesk-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">HH</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">Harry He</div>
                <div className="text-xs text-gray-500">Active conversation</div>
              </div>
              <div className="text-xs text-gray-400">Now</div>
            </div>
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-t border-gray-200">
          <Button className="w-full bg-talkdesk-500 hover:bg-talkdesk-600 text-white">
            <Send className="h-4 w-4 mr-2" />
            New conversation
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Conversation Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-talkdesk-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">HH</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Harry He</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Moderator</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${!message.isAgent ? 'justify-end' : ''}`}
                >
                  {message.isAgent && (
                    <div className="w-8 h-8 bg-talkdesk-500 rounded-full flex items-center justify-center">
                      <Send className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 ${!message.isAgent ? 'flex justify-end' : ''}`}>
                    {!message.isAgent && (
                      <div className="max-w-md">
                        <div className="flex items-center space-x-2 mb-1 justify-end">
                          <span className="text-xs text-gray-500">
                            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Now'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">Harry He</span>
                        </div>
                        <div className="bg-talkdesk-500 rounded-lg p-3">
                          <p className="text-sm text-white">{message.text}</p>
                        </div>
                      </div>
                    )}
                    {message.isAgent && (
                      <>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.text === "What can I help you today?" ? "ChatBot" : "Agent"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Now'}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                          <p className="text-sm text-gray-800">{message.text}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {!message.isAgent && (
                    <div className="w-8 h-8 bg-talkdesk-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">HH</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Replies */}
            <SmartReplies 
              lastUserMessage={lastUserMessage} 
              onReplySelect={handleReplySelect}
              onDirectSend={handleDirectSend}
            />

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              {/* AI Summary Display */}
              <AISummaryInput 
                isVisible={showSummary} 
                onDismiss={handleSummaryDismiss}
              />
              
              <div className="relative">
                <Textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Type '/' anywhere for commands)"
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 pb-10 focus:ring-2 focus:ring-talkdesk-500 focus:border-transparent"
                  rows={3}
                />
                <SmartCompose inputValue={inputValue} onSuggestionAccept={handleSuggestionAccept} isUserTyping={isUserTyping} showSlashCommands={showSlashCommands} />
                {/* Smart Suggestions positioned inside textarea */}
                <SmartSuggestions lastUserMessage={lastUserMessage} onInsertSuggestion={handleInsertSuggestion} />
                {/* Slash Commands popup */}
                <SlashCommands
                  isVisible={showSlashCommands}
                  onSelect={handleSlashCommandSelect}
                  onClose={() => setShowSlashCommands(false)}
                  lastUserMessage={lastUserMessage}
                />
                {/* Action Icons - including original 3 + AI icons */}
                <div className="absolute bottom-3 right-12 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Attach file"
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Add emoji"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplateModal(true)}
                    className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Templates"
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-gray-400 hover:text-talkdesk-500 hover:bg-talkdesk-50"
                    title="Polish text"
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-gray-400 hover:text-talkdesk-500 hover:bg-talkdesk-50"
                    title="Translate"
                  >
                    <Languages className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSummaryClick}
                    className="w-6 h-6 p-0 text-gray-400 hover:text-talkdesk-500 hover:bg-talkdesk-50"
                    title="Summarize"
                  >
                    <FileCheck className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-talkdesk-500 text-white rounded-full hover:bg-talkdesk-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-end mt-2">
                <div className="text-xs text-gray-500">Press Tab to accept AI suggestion</div>
              </div>
            </div>


          </div>

        </div>
      </div>

      <TemplateModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}
