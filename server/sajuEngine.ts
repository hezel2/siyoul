import { Lunar, LunarMonth, LunarYear, Solar } from 'lunar-typescript';
import type {
  FiveElementKey,
  FiveElementsCount,
  PillarDetail,
  SajuCalculationResult,
  SajuInput,
} from '../src/types/saju.ts';

interface StemMeta {
  hanja: string;
  hangul: string;
  element: FiveElementKey;
  yinYang: 'yang' | 'yin';
  index: number;
}

interface BranchMeta {
  hanja: string;
  hangul: string;
  element: FiveElementKey;
  yinYang: 'yang' | 'yin';
  animal: string;
  mainStemHanja: string;
  index: number;
}

const STEMS: Record<string, StemMeta> = {
  '甲': { hanja: '甲', hangul: '갑', element: 'wood', yinYang: 'yang', index: 0 },
  '乙': { hanja: '乙', hangul: '을', element: 'wood', yinYang: 'yin', index: 1 },
  '丙': { hanja: '丙', hangul: '병', element: 'fire', yinYang: 'yang', index: 2 },
  '丁': { hanja: '丁', hangul: '정', element: 'fire', yinYang: 'yin', index: 3 },
  '戊': { hanja: '戊', hangul: '무', element: 'earth', yinYang: 'yang', index: 4 },
  '己': { hanja: '己', hangul: '기', element: 'earth', yinYang: 'yin', index: 5 },
  '庚': { hanja: '庚', hangul: '경', element: 'metal', yinYang: 'yang', index: 6 },
  '辛': { hanja: '辛', hangul: '신', element: 'metal', yinYang: 'yin', index: 7 },
  '壬': { hanja: '壬', hangul: '임', element: 'water', yinYang: 'yang', index: 8 },
  '癸': { hanja: '癸', hangul: '계', element: 'water', yinYang: 'yin', index: 9 },
};

const BRANCHES: Record<string, BranchMeta> = {
  '子': { hanja: '子', hangul: '자', element: 'water', yinYang: 'yang', animal: '쥐', mainStemHanja: '癸', index: 0 },
  '丑': { hanja: '丑', hangul: '축', element: 'earth', yinYang: 'yin', animal: '소', mainStemHanja: '己', index: 1 },
  '寅': { hanja: '寅', hangul: '인', element: 'wood', yinYang: 'yang', animal: '호랑이', mainStemHanja: '甲', index: 2 },
  '卯': { hanja: '卯', hangul: '묘', element: 'wood', yinYang: 'yin', animal: '토끼', mainStemHanja: '乙', index: 3 },
  '辰': { hanja: '辰', hangul: '진', element: 'earth', yinYang: 'yang', animal: '용', mainStemHanja: '戊', index: 4 },
  '巳': { hanja: '巳', hangul: '사', element: 'fire', yinYang: 'yin', animal: '뱀', mainStemHanja: '丙', index: 5 },
  '午': { hanja: '午', hangul: '오', element: 'fire', yinYang: 'yang', animal: '말', mainStemHanja: '丁', index: 6 },
  '未': { hanja: '未', hangul: '미', element: 'earth', yinYang: 'yin', animal: '양', mainStemHanja: '己', index: 7 },
  '申': { hanja: '申', hangul: '신', element: 'metal', yinYang: 'yang', animal: '원숭이', mainStemHanja: '庚', index: 8 },
  '酉': { hanja: '酉', hangul: '유', element: 'metal', yinYang: 'yin', animal: '닭', mainStemHanja: '辛', index: 9 },
  '戌': { hanja: '戌', hangul: '술', element: 'earth', yinYang: 'yang', animal: '개', mainStemHanja: '戊', index: 10 },
  '亥': { hanja: '亥', hangul: '해', element: 'water', yinYang: 'yin', animal: '돼지', mainStemHanja: '壬', index: 11 },
};

const ELEMENT_KR: Record<FiveElementKey, string> = {
  wood: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
};

const GENERATES: Record<FiveElementKey, FiveElementKey> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

const CONTROLS: Record<FiveElementKey, FiveElementKey> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

const SOLAR_TERM_KR: Record<string, string> = {
  '立春': '입춘(立春)',
  '雨水': '우수(雨水)',
  '驚蟄': '경칩(驚蟄)',
  '惊蛰': '경칩(驚蟄)',
  '春分': '춘분(春分)',
  '清明': '청명(淸明)',
  '穀雨': '곡우(穀雨)',
  '谷雨': '곡우(穀雨)',
  '立夏': '입하(立夏)',
  '小滿': '소만(小滿)',
  '小满': '소만(小滿)',
  '芒種': '망종(芒種)',
  '芒种': '망종(芒種)',
  '夏至': '하지(夏至)',
  '小暑': '소서(小暑)',
  '大暑': '대서(大暑)',
  '立秋': '입추(立秋)',
  '處暑': '처서(處暑)',
  '处暑': '처서(處暑)',
  '白露': '백로(白露)',
  '秋分': '추분(秋分)',
  '寒露': '한로(寒露)',
  '霜降': '상강(霜降)',
  '立冬': '입동(立冬)',
  '小雪': '소설(小雪)',
  '大雪': '대설(大雪)',
  '冬至': '동지(冬至)',
  '小寒': '소한(小寒)',
  '大寒': '대한(大寒)',
};

function getTenGod(dayStem: StemMeta, targetStem: StemMeta): string {
  const samePolarity = dayStem.yinYang === targetStem.yinYang;
  if (dayStem.element === targetStem.element) {
    return samePolarity ? '비견' : '겁재';
  }
  if (GENERATES[dayStem.element] === targetStem.element) {
    return samePolarity ? '식신' : '상관';
  }
  if (CONTROLS[dayStem.element] === targetStem.element) {
    return samePolarity ? '편재' : '정재';
  }
  if (CONTROLS[targetStem.element] === dayStem.element) {
    return samePolarity ? '편관' : '정관';
  }
  return samePolarity ? '편인' : '정인';
}

export class SajuValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'SajuValidationError';
    this.statusCode = statusCode;
  }
}

export function getKstTodayParts(): { year: number; month: number; day: number } {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = formatted.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function buildPillarDetail(
  pillarStr: string,
  dayStem: StemMeta,
  isDayPillar = false
): PillarDetail {
  const stemChar = pillarStr.slice(0, 1);
  const branchChar = pillarStr.slice(1, 2);
  const stem = STEMS[stemChar];
  const branch = BRANCHES[branchChar];

  if (!stem || !branch) {
    throw new Error(`만세력 간지 해석 중 예기치 않은 문자가 발생했습니다.`);
  }

  const branchMainStem = STEMS[branch.mainStemHanja];

  return {
    stemHanja: stem.hanja,
    stemHangul: stem.hangul,
    stemElement: stem.element,
    stemYinYang: stem.yinYang,
    branchHanja: branch.hanja,
    branchHangul: branch.hangul,
    branchElement: branch.element,
    branchYinYang: branch.yinYang,
    animal: branch.animal,
    tenGodStem: isDayPillar ? '일간(나)' : getTenGod(dayStem, stem),
    tenGodBranch: getTenGod(dayStem, branchMainStem),
  };
}

export function calculateSaju(input: SajuInput): {
  calculation: SajuCalculationResult;
  displayMeta: {
    birthDateLabel: string;
    calendarLabel: string;
    timeLabel: string;
    genderLabel: string;
  };
  normalizedNickname: string;
  targetYear: number;
} {
  if (!input.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    throw new SajuValidationError('생년월일을 올바른 형식(YYYY-MM-DD)으로 입력해주세요.');
  }

  const [rawYear, rawMonth, rawDay] = input.birthDate.split('-').map(Number);
  if (
    !Number.isInteger(rawYear) ||
    !Number.isInteger(rawMonth) ||
    !Number.isInteger(rawDay) ||
    rawYear < 1900 ||
    rawYear > 2100 ||
    rawMonth < 1 ||
    rawMonth > 12 ||
    rawDay < 1 ||
    rawDay > 31
  ) {
    throw new SajuValidationError('입력하신 생년월일의 범위를 다시 확인해주세요.');
  }

  const kstToday = getKstTodayParts();
  const hour = input.birthTime.unknown ? 12 : Number(input.birthTime.hour);
  const minute = input.birthTime.unknown ? 0 : Number(input.birthTime.minute);

  if (
    !input.birthTime.unknown &&
    (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59)
  ) {
    throw new SajuValidationError('태어난 시간을 올바르게 입력해주세요.');
  }

  let solarYear = rawYear;
  let solarMonth = rawMonth;
  let solarDay = rawDay;
  let calendarLabel = '양력';

  if (input.calendarType === 'lunar') {
    const lunarYearObj = LunarYear.fromYear(rawYear);
    const actualLeapMonth = lunarYearObj.getLeapMonth();

    if (input.isLeapMonth) {
      if (actualLeapMonth === 0) {
        throw new SajuValidationError(`${rawYear}년 음력에는 윤달이 존재하지 않습니다.`);
      }
      if (actualLeapMonth !== rawMonth) {
        throw new SajuValidationError(
          `${rawYear}년의 윤달은 음력 ${actualLeapMonth}월입니다. 평달 또는 올바른 윤달을 선택해주세요.`
        );
      }
    }

    const signedLunarMonth = input.isLeapMonth ? -rawMonth : rawMonth;
    const lunarMonthObj = LunarMonth.fromYm(rawYear, signedLunarMonth);
    const maxDays = lunarMonthObj ? lunarMonthObj.getDayCount() : 0;

    if (!lunarMonthObj || rawDay > maxDays) {
      throw new SajuValidationError(
        `존재하지 않는 음력 날짜입니다. (${rawYear}년 ${input.isLeapMonth ? '윤' : ''}${rawMonth}월은 ${maxDays}일까지 있습니다.)`
      );
    }

    const lunarObj = Lunar.fromYmdHms(rawYear, signedLunarMonth, rawDay, hour, minute, 0);
    const convertedSolar = lunarObj.getSolar();
    solarYear = convertedSolar.getYear();
    solarMonth = convertedSolar.getMonth();
    solarDay = convertedSolar.getDay();
    calendarLabel = input.isLeapMonth ? '음력 (윤달)' : '음력 (평달)';
  } else {
    // Validate exact solar calendar date (e.g., reject Feb 30 or non-leap Feb 29)
    const testDate = new Date(Date.UTC(rawYear, rawMonth - 1, rawDay));
    if (
      testDate.getUTCFullYear() !== rawYear ||
      testDate.getUTCMonth() + 1 !== rawMonth ||
      testDate.getUTCDate() !== rawDay
    ) {
      throw new SajuValidationError('존재하지 않는 양력 날짜입니다. 날짜를 다시 확인해주세요.');
    }
  }

  // Block future dates compared to current KST date
  const inputDateNum = solarYear * 10000 + solarMonth * 100 + solarDay;
  const todayDateNum = kstToday.year * 10000 + kstToday.month * 100 + kstToday.day;
  if (inputDateNum > todayDateNum) {
    throw new SajuValidationError('미래의 날짜는 사주로 계산할 수 없습니다.');
  }

  // 1. Year & Month Pillars: convert KST instant (UTC+9) to UTC+8 for astronomical JieQi comparison
  const utcMinusOneHour = new Date(Date.UTC(solarYear, solarMonth - 1, solarDay, hour, minute, 0) - 3600 * 1000);
  const solarForTerm = Solar.fromYmdHms(
    utcMinusOneHour.getUTCFullYear(),
    utcMinusOneHour.getUTCMonth() + 1,
    utcMinusOneHour.getUTCDate(),
    utcMinusOneHour.getUTCHours(),
    utcMinusOneHour.getUTCMinutes(),
    0
  );
  const lunarForTerm = solarForTerm.getLunar();
  const ecForTerm = lunarForTerm.getEightChar();

  const yearPillarStr = ecForTerm.getYear();
  const monthPillarStr = ecForTerm.getMonth();

  // Retrieve nearest previous solar term name for informational transparency
  const prevJie = lunarForTerm.getPrevJie(true);
  const rawJieName = prevJie ? prevJie.getName() : '';
  const solarTermContext = SOLAR_TERM_KR[rawJieName] || rawJieName || '절기 기준';

  // 2. Day & Hour Pillars: KST local clock date/time with midnight 00:00 KST day boundary (sect = 2)
  const solarForClock = Solar.fromYmdHms(solarYear, solarMonth, solarDay, hour, minute, 0);
  const ecForClock = solarForClock.getLunar().getEightChar();
  ecForClock.setSect(2);

  const dayPillarStr = ecForClock.getDay();
  const timePillarStr = ecForClock.getTime();

  const dayStemChar = dayPillarStr.slice(0, 1);
  const dayStem = STEMS[dayStemChar];
  if (!dayStem) {
    throw new Error('일간 계산 중 오류가 발생했습니다.');
  }

  const yearPillar = buildPillarDetail(yearPillarStr, dayStem, false);
  const monthPillar = buildPillarDetail(monthPillarStr, dayStem, false);
  const dayPillar = buildPillarDetail(dayPillarStr, dayStem, true);
  const hourPillar = input.birthTime.unknown
    ? null
    : buildPillarDetail(timePillarStr, dayStem, false);

  const fiveElements: FiveElementsCount = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const activePillars = hourPillar
    ? [yearPillar, monthPillar, dayPillar, hourPillar]
    : [yearPillar, monthPillar, dayPillar];

  for (const pillar of activePillars) {
    fiveElements[pillar.stemElement] += 1;
    fiveElements[pillar.branchElement] += 1;
  }

  const totalElementsCount = activePillars.length * 2;
  const trimmedNickname = input.nickname.trim();
  const normalizedNickname = trimmedNickname.length > 0 ? trimmedNickname.slice(0, 24) : '당신';

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const birthDateLabel =
    input.calendarType === 'lunar'
      ? `${rawYear}년 ${input.isLeapMonth ? '윤' : ''}${rawMonth}월 ${rawDay}일 (양력 ${solarYear}.${pad2(solarMonth)}.${pad2(solarDay)})`
      : `${solarYear}년 ${solarMonth}월 ${solarDay}일`;

  const timeLabel = input.birthTime.unknown
    ? '태어난 시간 미상'
    : `${pad2(hour)}시 ${pad2(minute)}분 (${hourPillar?.branchHangul}시)`;

  const genderLabel =
    input.gender === 'male' ? '남성' : input.gender === 'female' ? '여성' : '성별 미선택';

  return {
    calculation: {
      pillars: {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
      },
      fiveElements,
      totalElementsCount,
      dayMaster: {
        stemHanja: dayStem.hanja,
        stemHangul: dayStem.hangul,
        element: dayStem.element,
        yinYang: dayStem.yinYang,
        label: `${dayStem.hangul}${ELEMENT_KR[dayStem.element]} · ${dayStem.yinYang === 'yang' ? '양(陽)' : '음(陰)'}`,
      },
      calculationMetadata: {
        timezone: 'Asia/Seoul',
        birthTimeUnknown: input.birthTime.unknown,
        calculationMethod: 'lunar-typescript-24jieqi-kst',
        dayBoundaryPolicy: 'kst-midnight-yajasi',
        solarTermContext,
      },
    },
    displayMeta: {
      birthDateLabel,
      calendarLabel,
      timeLabel,
      genderLabel,
    },
    normalizedNickname,
    targetYear: kstToday.year,
  };
}
