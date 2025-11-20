import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CyberThreat } from "@/utils/csvParser";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OllamaChatProps {
  data: CyberThreat[];
}

export const OllamaChat = ({ data }: OllamaChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare context with data summary
      const dataContext = `Dataset context: This dataset contains ${data.length} cyber security incidents across countries like ${[...new Set(data.map(d => d.country))].join(", ")}. Attack types include ${[...new Set(data.map(d => d.attackType))].join(", ")}. Industries affected: ${[...new Set(data.map(d => d.targetIndustry))].join(", ")}.`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama2",
          prompt: `${dataContext}\n\nUser question: ${input}\n\nProvide a detailed analysis based on the cyber threat data.`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Ollama");
      }

      const result = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to connect to Ollama. Make sure it's running on " + ollamaUrl);
      console.error("Ollama error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-effect p-6 h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Research Assistant</h3>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Ollama URL (e.g., http://localhost:11434)"
          value={ollamaUrl}
          onChange={(e) => setOllamaUrl(e.target.value)}
          className="text-sm"
        />
      </div>

      <ScrollArea className="flex-1 mb-4 pr-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>Ask questions about the cyber threat data!</p>
              <p className="text-sm mt-2">
                Examples: "What country has the most attacks?", "Analyze financial losses by industry"
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-primary/10 ml-8"
                  : "bg-secondary mr-8"
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === "user" ? "You" : "AI Assistant"}
              </p>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Ask a question about the data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
