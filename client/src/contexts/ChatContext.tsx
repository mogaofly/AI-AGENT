import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message, Template } from "@shared/schema";

interface ChatContextType {
  activeConversationId: string;
  conversations: Conversation[];
  messages: Message[];
  templates: Template[];
  sendMessage: (text: string, isAgent: boolean) => void;
  generateSmartCompose: (prompt: string) => Promise<string>;
  generateSmartSuggestions: (userMessage: string) => Promise<string[]>;
  generateSmartReplies: (messageText: string) => Promise<string[]>;
  generateSummary: () => Promise<string>;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState("default-conv");
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", activeConversationId, "messages"],
    enabled: !!activeConversationId,
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, isAgent }: { text: string; isAgent: boolean }) => {
      const response = await apiRequest(
        "POST",
        `/api/conversations/${activeConversationId}/messages`,
        { text, isAgent }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const sendMessage = useCallback((text: string, isAgent: boolean) => {
    if (text.trim()) {
      sendMessageMutation.mutate({ text: text.trim(), isAgent });
    }
  }, [sendMessageMutation]);

  const generateSmartCompose = useCallback(async (prompt: string): Promise<string> => {
    try {
      const response = await apiRequest("POST", "/api/smart-compose", {
        prompt,
        conversationId: activeConversationId,
      });
      const data = await response.json();
      return data.suggestion || "";
    } catch (error) {
      console.error("Failed to generate smart compose:", error);
      return "";
    }
  }, [activeConversationId]);

  const generateSmartSuggestions = useCallback(async (userMessage: string): Promise<string[]> => {
    try {
      const response = await apiRequest("POST", "/api/smart-suggestions", {
        userMessage,
        conversationId: activeConversationId,
      });
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error("Failed to generate smart suggestions:", error);
      return [];
    }
  }, [activeConversationId]);

  const generateSmartReplies = useCallback(async (messageText: string): Promise<string[]> => {
    try {
      const response = await apiRequest("POST", "/api/smart-replies", {
        messageText,
      });
      const data = await response.json();
      return data.replies || [];
    } catch (error) {
      console.error("Failed to generate smart replies:", error);
      return [];
    }
  }, []);

  const generateSummary = useCallback(async (): Promise<string> => {
    try {
      const response = await apiRequest("POST", `/api/conversations/${activeConversationId}/summary`);
      const data = await response.json();
      return data.summary || "";
    } catch (error) {
      console.error("Failed to generate summary:", error);
      return "";
    }
  }, [activeConversationId]);

  return (
    <ChatContext.Provider
      value={{
        activeConversationId,
        conversations,
        messages,
        templates,
        sendMessage,
        generateSmartCompose,
        generateSmartSuggestions,
        generateSmartReplies,
        generateSummary,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
