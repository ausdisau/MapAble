import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotLauncherProps {
  open: boolean;
  onClick: () => void;
  label: string;
}

export function ChatbotLauncher({ open, onClick, label }: ChatbotLauncherProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="dialog"
      data-testid="button-chatbot-launcher"
      className={cn(
        "fixed bottom-4 right-4 z-40 flex items-center justify-center",
        "h-14 w-14 rounded-full shadow-lg",
        "bg-[#1B6EB5] text-white",
        "hover:bg-[#14578F] focus:outline-none focus:ring-4 focus:ring-[#1B6EB5]/40",
        "transition-transform active:scale-95",
        open && "ring-4 ring-[#1B6EB5]/30",
      )}
    >
      <Bot className="h-6 w-6" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
