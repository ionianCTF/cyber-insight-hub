import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CyberThreat } from "@/utils/csvParser";

interface ChartsSectionProps {
  data: CyberThreat[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const ChartsSection = ({ data }: ChartsSectionProps) => {
  // Attack trends by year
  const yearlyData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.year === item.year);
    if (existing) {
      existing.count += 1;
      existing.loss += item.financialLoss;
    } else {
      acc.push({ year: item.year, count: 1, loss: item.financialLoss });
    }
    return acc;
  }, [] as { year: number; count: number; loss: number }[])
    .sort((a, b) => a.year - b.year);

  // Attack types distribution
  const attackTypeData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.attackType);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: item.attackType, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Top countries by attacks
  const countryData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.country === item.country);
    if (existing) {
      existing.attacks += 1;
      existing.loss += item.financialLoss;
    } else {
      acc.push({ country: item.country, attacks: 1, loss: item.financialLoss });
    }
    return acc;
  }, [] as { country: string; attacks: number; loss: number }[])
    .sort((a, b) => b.attacks - a.attacks)
    .slice(0, 10);

  // Industries affected
  const industryData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.industry === item.targetIndustry);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ industry: item.targetIndustry, count: 1 });
    }
    return acc;
  }, [] as { industry: string; count: number }[])
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-effect p-6">
        <h3 className="text-lg font-semibold mb-4">Attack Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="count" stroke={COLORS[0]} name="Attacks" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-effect p-6">
        <h3 className="text-lg font-semibold mb-4">Attack Types Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={attackTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {attackTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-effect p-6">
        <h3 className="text-lg font-semibold mb-4">Top Countries by Attacks</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={countryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="country" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="attacks" fill={COLORS[0]} name="Number of Attacks" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-effect p-6">
        <h3 className="text-lg font-semibold mb-4">Industries Under Attack</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={industryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--foreground))" />
            <YAxis dataKey="industry" type="category" stroke="hsl(var(--foreground))" width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar dataKey="count" fill={COLORS[2]} name="Attacks" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
