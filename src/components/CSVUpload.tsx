import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { CyberThreat } from "@/utils/csvParser";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface CSVUploadProps {
  onDataMapped: (data: CyberThreat[]) => void;
  ollamaUrl: string;
}

export const CSVUpload = ({ onDataMapped, ollamaUrl }: CSVUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const { toast } = useToast();

  const parseCSVText = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const mapColumnsWithOllama = async (headers: string[], sampleRow: string[]): Promise<Record<string, string>> => {
    const prompt = `You are a data mapping assistant. Map the following CSV columns to these target fields:
- country
- year
- attackType
- targetIndustry
- financialLoss
- affectedUsers
- attackSource
- securityVulnerability
- defenseMechanism
- resolutionTime

CSV Columns: ${headers.join(', ')}
Sample Data: ${sampleRow.join(', ')}

Return ONLY a JSON object mapping each target field to the CSV column name. Example:
{"country": "Country", "year": "Year", "attackType": "Attack Type", ...}`;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt,
        stream: false
      })
    });

    if (!response.ok) throw new Error('Ollama mapping failed');
    
    const data = await response.json();
    const jsonMatch = data.response.match(/\{[^}]+\}/);
    if (!jsonMatch) throw new Error('Could not extract mapping');
    
    return JSON.parse(jsonMatch[0]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      setProcessingStep("Reading CSV file...");
      const text = await file.text();
      
      setProcessingStep("Parsing CSV structure...");
      const rows = parseCSVText(text);
      
      if (rows.length < 2) {
        throw new Error('CSV must have headers and at least one data row');
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      setProcessingStep("Analyzing columns with AI...");
      toast({
        title: "Mapping columns...",
        description: "Using AI to map your CSV columns",
      });

      const mapping = await mapColumnsWithOllama(headers, dataRows[0]);

      setProcessingStep("Transforming data...");

      const mappedData: CyberThreat[] = dataRows.map(row => {
        const getVal = (field: string) => {
          const colName = mapping[field];
          const colIdx = headers.findIndex(h => h === colName);
          return colIdx >= 0 ? row[colIdx] : '';
        };

        return {
          country: getVal('country'),
          year: parseInt(getVal('year')) || 0,
          attackType: getVal('attackType'),
          targetIndustry: getVal('targetIndustry'),
          financialLoss: parseFloat(getVal('financialLoss')) || 0,
          affectedUsers: parseInt(getVal('affectedUsers')) || 0,
          attackSource: getVal('attackSource'),
          securityVulnerability: getVal('securityVulnerability'),
          defenseMechanism: getVal('defenseMechanism'),
          resolutionTime: parseInt(getVal('resolutionTime')) || 0,
        };
      });

      onDataMapped(mappedData);
      toast({
        title: "Success!",
        description: `Mapped ${mappedData.length} records`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process CSV",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
      event.target.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Upload Custom Dataset</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV file and AI will map columns automatically
          </p>
        </div>
        <div>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('csv-upload')?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStep || "Processing..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
