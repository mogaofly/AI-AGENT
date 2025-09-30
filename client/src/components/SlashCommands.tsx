import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, MessageSquare, Lightbulb, Clock, Star, Search, BookOpen } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  type: 'template' | 'suggestion' | 'reply' | 'ai' | 'faq' | 'search';
  content?: string;
  source?: string;
}

interface SlashCommandsProps {
  isVisible: boolean;
  onSelect: (content: string) => void;
  onClose: () => void;
  lastUserMessage: string;
}

export function SlashCommands({ isVisible, onSelect, onClose, lastUserMessage }: SlashCommandsProps) {
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { generateSmartSuggestions, generateSmartReplies, templates } = useChat();
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      if (searchQuery.trim()) {
        const timeoutId = setTimeout(() => {
          performSearch();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
      } else {
        loadContextualCommands();
      }
    }
  }, [isVisible, lastUserMessage, searchQuery]);

  // Focus search input when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % commands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (searchInputRef.current === document.activeElement) {
            // Don't handle enter if search input is focused
            return;
          }
          if (commands[selectedIndex]) {
            handleCommandSelect(commands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, commands, selectedIndex]);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setCommands([]);
      return;
    }

    try {
      // Search in templates
      const templateMatches = templates.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(template => ({
        id: `template-${template.id}`,
        title: template.title,
        description: template.content.substring(0, 80) + '...',
        icon: <FileText className="h-4 w-4" />,
        type: 'template' as const,
        content: template.content,
        source: 'Template'
      }));

      // Get FAQ responses from knowledge base
      const faqResponse = await fetch(`/api/knowledge-base/search?q=${encodeURIComponent(searchQuery)}`);
      const faqData = await faqResponse.json();
      const faqCommands: SlashCommand[] = faqData.slice(0, 3).map((item: any, index: number) => ({
        id: `faq-${index}`,
        title: item.question,
        description: item.answer.substring(0, 80) + '...',
        icon: <BookOpen className="h-4 w-4" />,
        type: 'faq' as const,
        content: item.answer,
        source: 'FAQ'
      }));

      // Get AI-generated responses based on search keywords
      const suggestions = await generateSmartSuggestions(searchQuery);
      const searchCommands: SlashCommand[] = suggestions.slice(0, 3).map((suggestion, index) => ({
        id: `search-${index}`,
        title: suggestion.substring(0, 60) + (suggestion.length > 60 ? '...' : ''),
        description: suggestion,
        icon: <Search className="h-4 w-4" />,
        type: 'search' as const,
        content: suggestion,
        source: 'AI Generated'
      }));

      // Combine results with priority: templates, FAQ, AI
      const allCommands = [...templateMatches, ...faqCommands, ...searchCommands];
      setCommands(allCommands.slice(0, 8)); // Limit to 8 results
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to perform search:', error);
      setCommands([]);
    }
  };

  const loadContextualCommands = async () => {
    const staticCommands: SlashCommand[] = [
      {
        id: 'welcome',
        title: 'Welcome Message',
        description: 'Greet the customer',
        icon: <MessageSquare className="h-4 w-4" />,
        type: 'template',
        content: 'Hello! Welcome to our support team. How can I assist you today?'
      },
      {
        id: 'escalate',
        title: 'Escalate to Supervisor',
        description: 'Transfer to supervisor',
        icon: <Star className="h-4 w-4" />,
        type: 'template',
        content: 'I understand your concern. Let me escalate this to my supervisor who can provide additional assistance.'
      },
      {
        id: 'follow-up',
        title: 'Follow-up',
        description: 'Check on previous issue',
        icon: <Clock className="h-4 w-4" />,
        type: 'template',
        content: 'I wanted to follow up on your previous inquiry. Is there anything else I can help you with regarding this matter?'
      }
    ];

    // Load AI-generated suggestions if we have a last user message
    if (lastUserMessage) {
      try {
        const [suggestions, replies] = await Promise.all([
          generateSmartSuggestions(lastUserMessage),
          generateSmartReplies(lastUserMessage)
        ]);

        const aiSuggestions: SlashCommand[] = suggestions.slice(0, 2).map((suggestion, index) => ({
          id: `suggestion-${index}`,
          title: suggestion.substring(0, 60) + (suggestion.length > 60 ? '...' : ''),
          description: suggestion,
          icon: <Lightbulb className="h-4 w-4" />,
          type: 'suggestion',
          content: suggestion,
          source: 'AI Generated'
        }));

        const aiReplies: SlashCommand[] = replies.slice(0, 2).map((reply, index) => ({
          id: `reply-${index}`,
          title: reply.substring(0, 60) + (reply.length > 60 ? '...' : ''),
          description: reply,
          icon: <Sparkles className="h-4 w-4" />,
          type: 'reply',
          content: reply,
          source: 'Smart Reply'
        }));

        setCommands([...staticCommands, ...aiSuggestions, ...aiReplies]);
      } catch (error) {
        console.error('Failed to load AI commands:', error);
        setCommands(staticCommands);
      }
    } else {
      setCommands(staticCommands);
    }
  };

  const handleCommandSelect = (command: SlashCommand) => {
    if (command.content) {
      onSelect(command.content);
    }
    onClose();
  };



  if (!isVisible) return null;

  return (
    <div 
      ref={popupRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
    >
      {/* Search input header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, FAQ, or enter keywords..."
            className="pl-7 h-8 text-sm border-gray-300"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {searchQuery.trim() ? 'Search Results' : 'Contextual Suggestions'}
        </div>
      </div>

      {/* Commands list */}
      <div className="max-h-64 overflow-y-auto">
        {commands.length === 0 ? (
          <div className="text-sm text-gray-400 py-4 px-3 text-center">
            {searchQuery.trim() ? 'No results found' : 'Loading suggestions...'}
          </div>
        ) : (
          commands.map((command, index) => (
            <Button
              key={command.id}
              variant="ghost"
              className={`w-full justify-start p-3 h-auto border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleCommandSelect(command)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`flex-shrink-0 p-1 rounded mt-0.5 ${
                  command.type === 'template' ? 'bg-green-100 text-green-600' :
                  command.type === 'suggestion' ? 'bg-yellow-100 text-yellow-600' :
                  command.type === 'reply' ? 'bg-blue-100 text-blue-600' :
                  command.type === 'faq' ? 'bg-emerald-100 text-emerald-600' :
                  command.type === 'search' ? 'bg-orange-100 text-orange-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {command.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {command.content}
                  </div>
                  {command.source && command.type !== 'template' && (
                    <div className="text-xs text-gray-400 mt-1">
                      {command.source}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}