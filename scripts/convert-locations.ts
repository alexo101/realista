import * as fs from 'fs';
import * as path from 'path';

interface DistrictStructure {
  district: string;
  neighborhoods: string[];
}

interface CityStructure {
  city: string;
  districts: DistrictStructure[];
}

interface ProvinceStructure {
  province: string;
  cities: CityStructure[];
}

interface CSVRow {
  Province: string;
  City: string;
  District: string;
  Neighborhood: string;
}

const SKIP_CITIES = ['Barcelona', 'Madrid'];

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
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
    
    if (values.length >= 4) {
      rows.push({
        Province: values[0] || '',
        City: values[1] || '',
        District: values[2] || '',
        Neighborhood: values[3] || ''
      });
    }
  }
  
  return rows;
}

function transformToHierarchy(rows: CSVRow[]): { provinces: ProvinceStructure[], provinceCities: Record<string, string[]> } {
  const provinceMap = new Map<string, Map<string, Map<string, Set<string>>>>();
  const provinceCities: Record<string, string[]> = {};
  
  for (const row of rows) {
    const { Province, City, District, Neighborhood } = row;
    
    if (!Province || !City) continue;
    if (SKIP_CITIES.includes(City)) continue;
    
    if (!provinceMap.has(Province)) {
      provinceMap.set(Province, new Map());
      provinceCities[Province] = [];
    }
    
    const cityMap = provinceMap.get(Province)!;
    if (!cityMap.has(City)) {
      cityMap.set(City, new Map());
      if (!provinceCities[Province].includes(City)) {
        provinceCities[Province].push(City);
      }
    }
    
    const districtMap = cityMap.get(City)!;
    
    if (!District) {
      continue;
    }
    
    if (!districtMap.has(District)) {
      districtMap.set(District, new Set());
    }
    
    if (Neighborhood) {
      districtMap.get(District)!.add(Neighborhood);
    }
  }
  
  const provinces: ProvinceStructure[] = [];
  
  for (const [provinceName, cityMap] of provinceMap) {
    const cities: CityStructure[] = [];
    
    for (const [cityName, districtMap] of cityMap) {
      const districts: DistrictStructure[] = [];
      
      for (const [districtName, neighborhoodSet] of districtMap) {
        districts.push({
          district: districtName,
          neighborhoods: Array.from(neighborhoodSet).sort()
        });
      }
      
      districts.sort((a, b) => a.district.localeCompare(b.district, 'es'));
      
      cities.push({
        city: cityName,
        districts
      });
    }
    
    cities.sort((a, b) => a.city.localeCompare(b.city, 'es'));
    
    provinces.push({
      province: provinceName,
      cities
    });
    
    provinceCities[provinceName].sort((a, b) => a.localeCompare(b, 'es'));
  }
  
  provinces.sort((a, b) => a.province.localeCompare(b.province, 'es'));
  
  return { provinces, provinceCities };
}

function generateTypeScript(provinces: ProvinceStructure[], provinceCities: Record<string, string[]>): string {
  const formatNeighborhoods = (neighborhoods: string[]): string => {
    if (neighborhoods.length === 0) return '[]';
    return `[${neighborhoods.map(n => `"${n.replace(/"/g, '\\"')}"`).join(', ')}]`;
  };
  
  const formatDistricts = (districts: DistrictStructure[]): string => {
    if (districts.length === 0) return '[]';
    const items = districts.map(d => 
      `    { district: "${d.district.replace(/"/g, '\\"')}", neighborhoods: ${formatNeighborhoods(d.neighborhoods)} }`
    );
    return `[\n${items.join(',\n')}\n  ]`;
  };
  
  const formatCity = (city: CityStructure): string => {
    return `  { city: "${city.city.replace(/"/g, '\\"')}", districts: ${formatDistricts(city.districts)} }`;
  };
  
  let output = `// Auto-generated file - DO NOT EDIT MANUALLY
// Generated from spain_locations.csv
// Last updated: ${new Date().toISOString().split('T')[0]}

import type { CityStructure } from './neighborhoods';

`;

  for (const province of provinces) {
    const varName = province.province
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();
    
    output += `// ${province.province} - ${province.cities.length} cities\n`;
    output += `export const ${varName}_CITIES: CityStructure[] = [\n`;
    output += province.cities.map(formatCity).join(',\n');
    output += `\n];\n\n`;
  }
  
  output += `// All Spain locations (excluding Barcelona and Madrid)\n`;
  output += `export const SPAIN_LOCATIONS: CityStructure[] = [\n`;
  
  const allCities: string[] = [];
  for (const province of provinces) {
    allCities.push(`  ...${province.province.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_CITIES`);
  }
  output += allCities.join(',\n');
  output += `\n];\n\n`;
  
  output += `// Province to cities mapping (for new Spain locations)\n`;
  output += `export const SPAIN_PROVINCE_CITIES: Record<string, string[]> = {\n`;
  
  const provinceCityEntries = Object.entries(provinceCities)
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([province, cities]) => {
      const citiesStr = cities.map(c => `"${c.replace(/"/g, '\\"')}"`).join(', ');
      return `  "${province}": [${citiesStr}]`;
    });
  
  output += provinceCityEntries.join(',\n');
  output += `\n};\n`;
  
  let stats = `\n// Statistics:\n`;
  stats += `// - Total provinces: ${provinces.length}\n`;
  stats += `// - Total cities: ${provinces.reduce((sum, p) => sum + p.cities.length, 0)}\n`;
  
  let totalDistricts = 0;
  let totalNeighborhoods = 0;
  let terminalCities = 0;
  let terminalDistricts = 0;
  
  for (const province of provinces) {
    for (const city of province.cities) {
      if (city.districts.length === 0) {
        terminalCities++;
      }
      totalDistricts += city.districts.length;
      for (const district of city.districts) {
        if (district.neighborhoods.length === 0) {
          terminalDistricts++;
        }
        totalNeighborhoods += district.neighborhoods.length;
      }
    }
  }
  
  stats += `// - Total districts: ${totalDistricts}\n`;
  stats += `// - Total neighborhoods: ${totalNeighborhoods}\n`;
  stats += `// - Terminal cities (no districts): ${terminalCities}\n`;
  stats += `// - Terminal districts (no neighborhoods): ${terminalDistricts}\n`;
  
  return output + stats;
}

async function main() {
  const csvPath = process.argv[2] || 'data/spain_locations.csv';
  const outputPath = process.argv[3] || 'client/src/utils/spain-locations.generated.ts';
  
  console.log(`Reading CSV from: ${csvPath}`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`Parsed ${rows.length} rows`);
  
  const { provinces, provinceCities } = transformToHierarchy(rows);
  
  console.log(`\nProcessed ${provinces.length} provinces:`);
  for (const p of provinces) {
    const cityCount = p.cities.length;
    const districtCount = p.cities.reduce((sum, c) => sum + c.districts.length, 0);
    console.log(`  - ${p.province}: ${cityCount} cities, ${districtCount} districts`);
  }
  
  const typescript = generateTypeScript(provinces, provinceCities);
  
  fs.writeFileSync(outputPath, typescript, 'utf-8');
  console.log(`\nGenerated TypeScript file: ${outputPath}`);
  
  const statsMatch = typescript.match(/\/\/ Statistics:[\s\S]+$/);
  if (statsMatch) {
    console.log('\n' + statsMatch[0].replace(/\/\/ /g, ''));
  }
}

main().catch(console.error);
