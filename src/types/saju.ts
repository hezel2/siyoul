export type CalendarType = 'solar' | 'lunar';

export type Gender = 'male' | 'female' | 'unspecified';

export type FiveElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface BirthTimeInput {
  hour: number;
  minute: number;
  unknown: boolean;
}

export interface SajuInput {
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  calendarType: CalendarType;
  isLeapMonth: boolean;
  birthTime: BirthTimeInput;
  gender: Gender;
  timezone: 'Asia/Seoul';
}

export interface PillarDetail {
  stemHanja: string;
  stemHangul: string;
  stemElement: FiveElementKey;
  stemYinYang: 'yang' | 'yin';
  branchHanja: string;
  branchHangul: string;
  branchElement: FiveElementKey;
  branchYinYang: 'yang' | 'yin';
  animal: string;
  tenGodStem: string;
  tenGodBranch: string;
}

export interface FiveElementsCount {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface SajuCalculationResult {
  pillars: {
    year: PillarDetail;
    month: PillarDetail;
    day: PillarDetail;
    hour: PillarDetail | null;
  };
  fiveElements: FiveElementsCount;
  totalElementsCount: number;
  dayMaster: {
    stemHanja: string;
    stemHangul: string;
    element: FiveElementKey;
    yinYang: 'yang' | 'yin';
    label: string;
  };
  calculationMetadata: {
    timezone: 'Asia/Seoul';
    birthTimeUnknown: boolean;
    calculationMethod: string;
    dayBoundaryPolicy: string;
    solarTermContext: string;
  };
}

export interface GeminiSajuSection {
  title: string;
  content: string;
}

export interface GeminiSajuReport {
  title: string;
  summary: string;
  sections: {
    overall: GeminiSajuSection;
    personality: GeminiSajuSection;
    wealth: GeminiSajuSection;
    love: GeminiSajuSection;
    health: GeminiSajuSection;
    yearly: GeminiSajuSection;
  };
  advice: string;
}

export interface SajuAnalysisResponse {
  nickname: string;
  displayMeta: {
    birthDateLabel: string;
    calendarLabel: string;
    timeLabel: string;
    genderLabel: string;
  };
  calculation: SajuCalculationResult;
  report: GeminiSajuReport;
  targetYear: number;
}

export interface SavedSajuReading extends SajuAnalysisResponse {
  id: string;
  ownerId: string;
  memo: string;
  isPinned: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}
