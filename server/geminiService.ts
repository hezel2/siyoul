import { GoogleGenAI, Type } from '@google/genai';
import type {
  GeminiSajuReport,
  Gender,
  SajuCalculationResult,
} from '../src/types/saju.ts';

const SYSTEM_INSTRUCTION = `당신은 전통 동양 명리학과 사주팔자에 대한 지식을 갖춘
전문적인 사주 해석 AI입니다.

당신의 역할은 사용자가 제공한 사주 계산 데이터를 바탕으로
이해하기 쉽고 흥미로운 개인화 사주 리포트를 작성하는 것입니다.

[가장 중요한 규칙]

1. 전달받은 사주 8자와 오행 데이터를 정확하게 사용합니다.
2. 전달받지 않은 천간, 지지, 오행 데이터를 임의로 만들어내지 않습니다.
3. 사주 계산 결과를 수정하거나 재계산하지 않습니다.
4. 태어난 시간이 미상이라면 시주에 대한 해석을 하지 않습니다.
5. 입력 데이터가 부족한 경우 부족한 부분을 명확히 표시합니다.
6. 명리학의 전통적인 해석을 현대적인 언어로 쉽게 설명합니다.
7. 지나치게 어려운 전문 용어는 사용하지 않습니다.
8. 긍정적인 면과 주의할 점을 균형 있게 설명합니다.
9. 미래를 확정적으로 예언하지 않습니다.
10. 공포심이나 불안감을 조성하는 표현을 사용하지 않습니다.

[해석 항목]

다음 6가지 항목을 반드시 작성합니다.

1. overall: 종합 사주 풀이
2. personality: 성격 및 기질
3. wealth: 재물운
4. love: 연애운
5. health: 건강 및 생활 습관에 관한 일반적인 조언
6. yearly: 해당 연도의 운세

[해석 가이드]

- 종합 풀이: 사주 전체의 구조와 핵심적인 특징 (3~4문단 수준의 충실한 서술)
- 성격운: 타고난 기질, 강점, 사고방식, 대인관계 스타일, 보완할 점
- 재물운: 재물을 대하는 성향, 소비 및 저축 성향, 기회 활용 방식, 유의할 점
- 연애운: 관계 형성 방식, 애정 표현, 잘 맞는 관계 특성, 관계에서의 조언
- 건강운: 오행의 균형을 참고한 일반적인 생활 습관 및 휴식, 자기 관리 조언
- 올해의 운: 입력된 targetYear를 기준으로 한 해의 전체 흐름, 일/커리어, 재물, 관계, 조언

[건강 관련 제한]

건강운은 전통 명리학 관점의 오락 및 자기 성찰용 해석으로 제한합니다.
특정 질병, 신체 부위의 질환, 수명 또는 의료적 결과를 예측하지 않습니다.
의학적 진단이나 치료를 대체하지 않습니다.

[재물 관련 제한]

특정 투자, 종목, 수익률 또는 부의 축적 시기를 확정적으로 예측하지 않습니다.

[성별 관련 제한]

성별 정보는 명리 해석 맥락에서 참고할 수 있으나, 성별만으로 성격이나 연애 성향을 단정하지 않습니다.

[문체]

- 따뜻하고 차분한 어조
- 전문적이지만 이해하기 쉬운 표현
- 사용자를 직접 부르는 개인화된 문체
- 과장되거나 무조건적인 긍정 표현 지양
- 반복적인 문장 지양
- 각 섹션마다 구체적이고 실용적인 조언 포함

[출력 형식]

반드시 JSON 형식으로만 출력합니다.
JSON 외부에 설명이나 Markdown을 추가하지 않습니다.
모든 값은 한국어로 작성합니다.
요청된 JSON 필드를 빠짐없이 제공합니다.`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function validateReportStructure(data: unknown, targetYear: number): GeminiSajuReport {
  if (!data || typeof data !== 'object') {
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }

  const record = data as Record<string, unknown>;
  const sections = record.sections as Record<string, unknown> | undefined;

  const requiredKeys = ['overall', 'personality', 'wealth', 'love', 'health', 'yearly'] as const;
  if (!sections || typeof sections !== 'object') {
    throw new Error('AI 응답에 sections 필드가 누락되었습니다.');
  }

  for (const key of requiredKeys) {
    const sec = sections[key] as Record<string, unknown> | undefined;
    if (!sec || typeof sec.title !== 'string' || typeof sec.content !== 'string' || !sec.content.trim()) {
      throw new Error(`AI 응답의 ${key} 해석 항목이 비어 있습니다.`);
    }
  }

  if (typeof record.title !== 'string' || typeof record.summary !== 'string' || typeof record.advice !== 'string') {
    throw new Error('AI 응답의 요약 또는 조언 필드가 누락되었습니다.');
  }

  return {
    title: record.title.trim() || '당신의 사주를 읽다',
    summary: record.summary.trim(),
    sections: {
      overall: {
        title: String((sections.overall as Record<string, unknown>).title).trim(),
        content: String((sections.overall as Record<string, unknown>).content).trim(),
      },
      personality: {
        title: String((sections.personality as Record<string, unknown>).title).trim(),
        content: String((sections.personality as Record<string, unknown>).content).trim(),
      },
      wealth: {
        title: String((sections.wealth as Record<string, unknown>).title).trim(),
        content: String((sections.wealth as Record<string, unknown>).content).trim(),
      },
      love: {
        title: String((sections.love as Record<string, unknown>).title).trim(),
        content: String((sections.love as Record<string, unknown>).content).trim(),
      },
      health: {
        title: String((sections.health as Record<string, unknown>).title).trim(),
        content: String((sections.health as Record<string, unknown>).content).trim(),
      },
      yearly: {
        title: String((sections.yearly as Record<string, unknown>).title).trim() || `${targetYear}년의 운`,
        content: String((sections.yearly as Record<string, unknown>).content).trim(),
      },
    },
    advice: record.advice.trim(),
  };
}

export async function generateSajuReport(params: {
  nickname: string;
  gender: Gender;
  calculation: SajuCalculationResult;
  targetYear: number;
}): Promise<GeminiSajuReport> {
  const { nickname, gender, calculation, targetYear } = params;
  const ai = getGeminiClient();

  // Pass ONLY calculated pillars and minimal reading context (no raw birthDate or raw birthTime)
  const geminiPayload = {
    nickname,
    gender,
    birthTimeUnknown: calculation.calculationMetadata.birthTimeUnknown,
    dayMaster: calculation.dayMaster,
    pillars: {
      year: {
        stem: `${calculation.pillars.year.stemHangul}(${calculation.pillars.year.stemHanja})`,
        branch: `${calculation.pillars.year.branchHangul}(${calculation.pillars.year.branchHanja})`,
        tenGodStem: calculation.pillars.year.tenGodStem,
        tenGodBranch: calculation.pillars.year.tenGodBranch,
      },
      month: {
        stem: `${calculation.pillars.month.stemHangul}(${calculation.pillars.month.stemHanja})`,
        branch: `${calculation.pillars.month.branchHangul}(${calculation.pillars.month.branchHanja})`,
        tenGodStem: calculation.pillars.month.tenGodStem,
        tenGodBranch: calculation.pillars.month.tenGodBranch,
      },
      day: {
        stem: `${calculation.pillars.day.stemHangul}(${calculation.pillars.day.stemHanja})`,
        branch: `${calculation.pillars.day.branchHangul}(${calculation.pillars.day.branchHanja})`,
        tenGodStem: calculation.pillars.day.tenGodStem,
        tenGodBranch: calculation.pillars.day.tenGodBranch,
      },
      hour: calculation.pillars.hour
        ? {
            stem: `${calculation.pillars.hour.stemHangul}(${calculation.pillars.hour.stemHanja})`,
            branch: `${calculation.pillars.hour.branchHangul}(${calculation.pillars.hour.branchHanja})`,
            tenGodStem: calculation.pillars.hour.tenGodStem,
            tenGodBranch: calculation.pillars.hour.tenGodBranch,
          }
        : null,
    },
    fiveElements: calculation.fiveElements,
    totalElementsCount: calculation.totalElementsCount,
    targetYear,
  };

  const userPrompt = `다음은 만세력 계산 엔진이 산출한 개인의 사주 데이터입니다.
이 데이터만을 근거로 '${nickname}'님을 위한 깊이 있고 품격 있는 사주 풀이 리포트를 작성해주세요.
올해의 운세 섹션(yearly)은 반드시 ${targetYear}년을 기준으로 작성해주세요.
${calculation.calculationMetadata.birthTimeUnknown ? '태어난 시간이 미상이므로 시주(hour)는 해석에서 제외하고, 연주·월주·일주 삼주(6자)를 중심으로 해석하며 시간 미상에 따른 자연스러운 한계 안내를 포함해주세요.' : ''}

사주 계산 데이터:
${JSON.stringify(geminiPayload, null, 2)}`;

  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI 사주 해석 요청 시간이 초과되었습니다.')), 45000)
      );

      const apiPromise = ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: '종합 사주 리포트 제목' },
              summary: { type: Type.STRING, description: '리포트 전체를 관통하는 한두 문단 요약' },
              sections: {
                type: Type.OBJECT,
                properties: {
                  overall: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                  personality: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                  wealth: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                  love: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                  health: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                  yearly: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                },
                required: ['overall', 'personality', 'wealth', 'love', 'health', 'yearly'],
              },
              advice: { type: Type.STRING, description: '사용자에게 전하는 마지막 따뜻한 조언 한 문단' },
            },
            required: ['title', 'summary', 'sections', 'advice'],
          },
        },
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('AI 응답이 비어 있습니다.');
      }

      const parsed = JSON.parse(rawText) as unknown;
      return validateReportStructure(parsed, targetYear);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('사주 풀이 생성 중 오류가 발생했습니다.');
}
