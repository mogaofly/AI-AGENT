import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/ChatContext";

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (content: string) => void;
}

export function TemplateModal({ open, onOpenChange, onTemplateSelect }: TemplateModalProps) {
  const { templates } = useChat();

  const handleTemplateClick = (content: string) => {
    onTemplateSelect(content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message Templates</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-talkdesk-300 transition-colors"
              onClick={() => handleTemplateClick(template.content)}
            >
              <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
              <p className="text-sm text-gray-600">
                {template.content.length > 100
                  ? `${template.content.substring(0, 100)}...`
                  : template.content}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
