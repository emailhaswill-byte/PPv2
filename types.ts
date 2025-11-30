export interface AlternativeRock {
  name: string;
  description: string;
  wikiUrl: string;
}

export interface RockAnalysis {
  name: string;
  scientificName: string;
  description: string;
  economicValue: 'Low' | 'Moderate' | 'High' | 'Very High';
  economicDetails: string;
  containsPreciousMetals: boolean;
  associatedMetals: string[];
  alternatives: AlternativeRock[];
  confidence: number;
}

export interface SavedScan {
  id: string;
  timestamp: number;
  imageUrl: string;
  analysis: RockAnalysis;
}

export enum AppView {
  HOME = 'HOME',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  GALLERY = 'GALLERY'
}

export type UploadError = string | null;