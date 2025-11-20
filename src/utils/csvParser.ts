export interface CyberThreat {
  country: string;
  year: number;
  attackType: string;
  targetIndustry: string;
  financialLoss: number;
  affectedUsers: number;
  attackSource: string;
  securityVulnerability: string;
  defenseMechanism: string;
  resolutionTime: number;
}

export const parseCSV = async (filePath: string): Promise<CyberThreat[]> => {
  try {
    const response = await fetch(filePath);
    const text = await response.text();
    
    const lines = text.trim().split('\n');
    const data: CyberThreat[] = [];
    
    // Skip header lines (first 2 lines: header and separator)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('|---')) continue;
      
      // Parse markdown table format
      const values = line
        .split('|')
        .map(v => v.trim())
        .filter(v => v !== '');
      
      if (values.length >= 10) {
        data.push({
          country: values[0],
          year: parseInt(values[1]),
          attackType: values[2],
          targetIndustry: values[3],
          financialLoss: parseFloat(values[4]),
          affectedUsers: parseInt(values[5]),
          attackSource: values[6],
          securityVulnerability: values[7],
          defenseMechanism: values[8],
          resolutionTime: parseInt(values[9]),
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};
