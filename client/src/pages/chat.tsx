import { ConversationWindow } from "@/components/ConversationWindow";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { ChatProvider } from "@/contexts/ChatContext";

export default function Chat() {
  return (
    <ChatProvider>
      <div className="h-screen bg-gray-50 flex gap-4 p-4">
        {/* Left side - Conversation Window */}
        <div className="flex-1">
          <ConversationWindow />
        </div>
        {/* Right side - Chat Widget */}
        <div className="flex-shrink-0 flex flex-col justify-end">
          <FloatingChatWidget />
        </div>
      </div>
    </ChatProvider>
  );
}
