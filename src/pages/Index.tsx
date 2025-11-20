import { useEffect, useState } from "react";
import { parseCSV, CyberThreat } from "@/utils/csvParser";
import { MetricCard } from "@/components/MetricCard";
import { FilterPanel } from "@/components/FilterPanel";
import { OllamaChat } from "@/components/OllamaChat";
import { ChartsSection } from "@/components/ChartsSection";
import { Shield, DollarSign, Users, Clock } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [data, setData] = useState<CyberThreat[]>([]);
  const [filteredData, setFilteredData] = useState<CyberThreat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const parsed = await parseCSV("/src/data/cyber-threats.csv");
        setData(parsed);
        setFilteredData(parsed);
        toast.success(`Loaded ${parsed.length} cyber threat records`);
      } catch (error) {
        toast.error("Failed to load data");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (filters: {
    country?: string;
    year?: number;
    attackType?: string;
    industry?: string;
  }) => {
    let filtered = [...data];

    if (filters.country) {
      filtered = filtered.filter((d) => d.country === filters.country);
    }
    if (filters.year) {
      filtered = filtered.filter((d) => d.year === filters.year);
    }
    if (filters.attackType) {
      filtered = filtered.filter((d) => d.attackType === filters.attackType);
    }
    if (filters.industry) {
      filtered = filtered.filter((d) => d.targetIndustry === filters.industry);
    }

    setFilteredData(filtered);
  };

  const totalAttacks = filteredData.length;
  const totalLoss = filteredData.reduce((sum, d) => sum + d.financialLoss, 0);
  const totalAffected = filteredData.reduce((sum, d) => sum + d.affectedUsers, 0);
  const avgResolutionTime = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.resolutionTime, 0) / filteredData.length
    : 0;

  const uniqueCountries = [...new Set(data.map((d) => d.country))].sort();
  const uniqueYears = [...new Set(data.map((d) => d.year))].sort();
  const uniqueAttackTypes = [...new Set(data.map((d) => d.attackType))].sort();
  const uniqueIndustries = [...new Set(data.map((d) => d.targetIndustry))].sort();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-primary mx-auto animate-pulse" />
          <p className="text-xl text-foreground">Loading Cyber Threat Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Cyber Threat Intelligence Dashboard
            </h1>
            <p className="text-muted-foreground">
              Interactive analysis powered by Ollama AI
            </p>
          </div>
        </div>
      </header>

      <FilterPanel
        countries={uniqueCountries}
        years={uniqueYears}
        attackTypes={uniqueAttackTypes}
        industries={uniqueIndustries}
        onFilterChange={handleFilterChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Incidents"
          value={totalAttacks.toLocaleString()}
          icon={Shield}
          description="Recorded cyber attacks"
        />
        <MetricCard
          title="Financial Impact"
          value={`$${totalLoss.toFixed(2)}M`}
          icon={DollarSign}
          description="Total losses"
        />
        <MetricCard
          title="Users Affected"
          value={totalAffected.toLocaleString()}
          icon={Users}
          description="Across all incidents"
        />
        <MetricCard
          title="Avg Resolution"
          value={`${avgResolutionTime.toFixed(1)}h`}
          icon={Clock}
          description="Time to resolve"
        />
      </div>

      <ChartsSection data={filteredData} />

      <OllamaChat data={filteredData} />
    </div>
  );
};

export default Index;
