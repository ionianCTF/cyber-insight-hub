import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CyberThreat } from "@/utils/csvParser";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Message {
  role: "user" | "assistant";
  content: string;
  visualization?: {
    type: "table" | "bar" | "line" | "pie" | "radar";
    data: any[];
    title?: string;
  };
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
      // Prepare detailed data context
      const dataContext = `You are analyzing a cyber threat dataset with ${data.length} records. Here's the complete data in JSON format:
${JSON.stringify(data.slice(0, 50), null, 2)}

Available fields: country, year, attackType, targetIndustry, financialLoss, affectedUsers, attackSource, securityVulnerability, defenseMechanism, resolutionTime.

IMPORTANT: You MUST respond in the following structured format:

## Analysis
[2 concise paragraphs analyzing the data]

## Key Findings
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]
[2-5 bullets total]

## Visualization Data
[Provide data for visualization in JSON format. Choose the most appropriate chart type: table, bar, line, pie, or radar]
Format: {"type": "bar|line|pie|table|radar", "title": "Chart Title", "data": [{"label": "value1", "value": number}, ...]}`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama2",
          prompt: `${dataContext}\n\nUser question: ${input}\n\nAnalyze ONLY the provided CSV data and respond in the specified format with visualization data.`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Ollama");
      }

      const result = await response.json();
      
      // Parse response to extract visualization data
      let visualization;
      let cleanContent = result.response;
      
      const jsonMatch = result.response.match(/\{[\s\S]*"type"[\s\S]*"data"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          visualization = JSON.parse(jsonMatch[0]);
          cleanContent = result.response.replace(jsonMatch[0], '').trim();
        } catch (e) {
          console.error("Failed to parse visualization data:", e);
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: cleanContent,
        visualization,
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
              <p className="text-sm font-semibold mb-2">
                {message.role === "user" ? "You" : "AI Assistant"}
              </p>
              <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                {message.content}
              </div>
              
              {message.visualization && (
                <div className="mt-4 bg-background/50 p-4 rounded-lg border border-border">
                  {message.visualization.title && (
                    <h4 className="text-sm font-semibold mb-3">{message.visualization.title}</h4>
                  )}
                  {message.visualization.type === "table" && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(message.visualization.data[0] || {}).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {message.visualization.data.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((val, j) => (
                              <TableCell key={j}>{String(val)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  
                  {message.visualization.type === "bar" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={message.visualization.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  
                  {message.visualization.type === "line" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={message.visualization.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  
                  {message.visualization.type === "pie" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={message.visualization.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.label}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {message.visualization.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${180 + index * 40}, 70%, 50%)`} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  
                  {message.visualization.type === "radar" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={message.visualization.data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="label" />
                        <PolarRadiusAxis />
                        <Radar name="Value" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
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
