import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Share2, Copy, Download, RotateCcw, Check, AlertCircle } from 'lucide-react';
import type {
  FiveElementKey,
  PillarDetail,
  SajuAnalysisResponse,
} from '../types/saju';
import { downloadSajuCardImage } from '../utils/shareCard';

interface ResultViewProps {
  result: SajuAnalysisResponse;
  onRestart: () => void;
  onShareEvent: (phase: 'click' | 'success') => void;
}

const ELEMENT_INFO: Record<
  FiveElementKey,
  {
    kr: string;
    hanja: string;
    color: string;
    border: string;
    meaning: string;
  }
> = {
  wood: {
    kr: '목',
    hanja: '木',
    color: '#6B8E6B',
    border: 'border-[#6B8E6B]/45',
    meaning: '성장과 기획, 생명력, 새로운 시작을 여는 추진력',
  },
  fire: {
    kr: '화',
    hanja: '火',
    color: '#B86B52',
    border: 'border-[#B86B52]/45',
    meaning: '열정과 표현, 확산, 사람들을 밝히는 따뜻한 에너지',
  },
  earth: {
    kr: '토',
    hanja: '土',
    color: '#C6A76A',
    border: 'border-[#C6A76A]/45',
    meaning: '중심과 신뢰, 포용력, 변화를 조율하는 안정감',
  },
  metal: {
    kr: '금',
    hanja: '金',
    color: '#C8C2B6',
    border: 'border-[#C8C2B6]/45',
    meaning: '결단과 원칙, 정교함, 본질을 가려내는 분별력',
  },
  water: {
    kr: '수',
    hanja: '水',
    color: '#5F7A94',
    border: 'border-[#5F7A94]/45',
    meaning: '지혜와 유연함, 깊은 사유, 흐름을 읽는 통찰력',
  },
};

const ELEMENT_ORDER: FiveElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

function renderParagraphs(text: string) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function PillarCard({
  title,
  subTitle,
  pillar,
  isDayPillar,
  index,
}: {
  title: string;
  subTitle: string;
  pillar: PillarDetail | null;
  isDayPillar?: boolean;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col rounded-sm border p-5 text-center ${
        isDayPillar
          ? 'border-[#C6A76A] bg-[#24211C]'
          : 'border-[#4B4030]/75 bg-[#1B1A17]'
      }`}
    >
      <div className="border-b border-[#4B4030]/50 pb-3">
        <p
          className={`text-xs tracking-wider ${
            isDayPillar ? 'font-semibold text-[#E2CA91]' : 'text-[#A9A396]'
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-[#A9A396]">{subTitle}</p>
      </div>

      {!pillar ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <p className="font-serif-kr text-2xl text-[#A9A396]">시간 미상</p>
          <p className="mt-2 text-xs leading-relaxed text-[#A9A396]/80">
            출생 시간 미입력으로
            <br />
            시주를 생성하지 않음
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between divide-y divide-[#4B4030]/50">
          {/* Heavenly Stem (천간) */}
          <div className="py-5">
            <p className="text-[11px] text-[#A9A396]">
              천간 · {pillar.tenGodStem}
            </p>
            <p
              className="font-serif-kr mt-2 text-5xl font-semibold leading-none"
              style={{ color: ELEMENT_INFO[pillar.stemElement].color }}
            >
              {pillar.stemHanja}
            </p>
            <p className="mt-3 text-sm font-medium text-[#F3EFE5]">
              {pillar.stemHangul} · {ELEMENT_INFO[pillar.stemElement].kr}(
              {ELEMENT_INFO[pillar.stemElement].hanja})
            </p>
            <p className="mt-0.5 text-[11px] text-[#A9A396]">
              {pillar.stemYinYang === 'yang' ? '양(陽)' : '음(陰)'}
            </p>
          </div>

          {/* Earthly Branch (지지) */}
          <div className="pt-5 pb-1">
            <p className="text-[11px] text-[#A9A396]">
              지지 · {pillar.tenGodBranch}
            </p>
            <p
              className="font-serif-kr mt-2 text-5xl font-semibold leading-none"
              style={{ color: ELEMENT_INFO[pillar.branchElement].color }}
            >
              {pillar.branchHanja}
            </p>
            <p className="mt-3 text-sm font-medium text-[#F3EFE5]">
              {pillar.branchHangul} · {ELEMENT_INFO[pillar.branchElement].kr}(
              {ELEMENT_INFO[pillar.branchElement].hanja})
            </p>
            <p className="mt-0.5 text-[11px] text-[#A9A396]">
              {pillar.animal}띠 기운 · {pillar.branchYinYang === 'yang' ? '양(陽)' : '음(陰)'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function ResultView({
  result,
  onRestart,
  onShareEvent,
}: ResultViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [shareFeedback, setShareFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  const { calculation, report, nickname, displayMeta, targetYear } = result;
  const totalCount = calculation.totalElementsCount || 8;

  const elementSummaryText = useMemo(() => {
    const entries = ELEMENT_ORDER.map((k) => ({
      key: k,
      count: calculation.fiveElements[k],
    }));
    const maxVal = Math.max(...entries.map((e) => e.count));
    const minVal = Math.min(...entries.map((e) => e.count));
    const strongest = entries
      .filter((e) => e.count === maxVal)
      .map((e) => `${ELEMENT_INFO[e.key].kr}(${ELEMENT_INFO[e.key].hanja})`)
      .join(', ');
    const missing = entries
      .filter((e) => e.count === 0)
      .map((e) => `${ELEMENT_INFO[e.key].kr}(${ELEMENT_INFO[e.key].hanja})`);

    if (maxVal - minVal <= 1 && missing.length === 0) {
      return `다섯 가지 기운이 큰 치우침 없이 고르게 분포하여 유연한 균형감을 지니고 있습니다.`;
    }
    if (missing.length > 0) {
      return `${strongest}의 기운이 두드러지며, 사주 원국에 드러나지 않은 ${missing.join(', ')}의 기운은 삶의 환경과 선택을 통해 자연스럽게 보완해 나가면 조화가 깊어집니다.`;
    }
    return `${strongest}의 기운이 중심을 이루고 있어, 해당 기운의 성향이 삶의 태도와 선택에서 선명하게 드러납니다.`;
  }, [calculation.fiveElements]);

  // Pentagon SVG radar coordinates
  const pentagonPoints = useMemo(() => {
    const cx = 140;
    const cy = 140;
    const maxR = 96;
    const maxCount = Math.max(3, ...Object.values(calculation.fiveElements));

    const vertices = ELEMENT_ORDER.map((key, idx) => {
      const angle = (idx * 72 - 90) * (Math.PI / 180);
      const val = calculation.fiveElements[key];
      const ratio = Math.max(0.16, val / maxCount);
      const r = maxR * ratio;
      return {
        key,
        outerX: cx + Math.cos(angle) * maxR,
        outerY: cy + Math.sin(angle) * maxR,
        labelX: cx + Math.cos(angle) * (maxR + 24),
        labelY: cy + Math.sin(angle) * (maxR + 24),
        dataX: cx + Math.cos(angle) * r,
        dataY: cy + Math.sin(angle) * r,
      };
    });

    const dataPolygon = vertices
      .map((v) => `${v.dataX.toFixed(1)},${v.dataY.toFixed(1)}`)
      .join(' ');
    const outerPolygon = vertices
      .map((v) => `${v.outerX.toFixed(1)},${v.outerY.toFixed(1)}`)
      .join(' ');
    const midPolygon = ELEMENT_ORDER.map((_, idx) => {
      const angle = (idx * 72 - 90) * (Math.PI / 180);
      const r = maxR * 0.5;
      return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
    }).join(' ');

    return { vertices, dataPolygon, outerPolygon, midPolygon };
  }, [calculation.fiveElements]);

  // Privacy-safe share payload: NO birthDate or birthTime included
  const buildPrivacySafeShareText = () => {
    const p = calculation.pillars;
    const pillarsSummary = [
      `${p.year.stemHanja}${p.year.branchHanja}`,
      `${p.month.stemHanja}${p.month.branchHanja}`,
      `${p.day.stemHanja}${p.day.branchHanja}`,
      p.hour ? `${p.hour.stemHanja}${p.hour.branchHanja}` : '시간미상',
    ].join(' · ');

    return `[시율 時律] ${nickname}님의 ${targetYear}년 사주 리포트\n사주팔자: ${pillarsSummary}\n일간: ${calculation.dayMaster.label}\n\n"${report.title}"\n${window.location.origin}`;
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setShareFeedback({ type, message });
    window.setTimeout(() => {
      setShareFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const handleWebShare = async () => {
    onShareEvent('click');
    const shareText = buildPrivacySafeShareText();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `시율 時律 — ${nickname}님의 사주 리포트`,
          text: shareText,
          url: window.location.origin,
        });
        onShareEvent('success');
        showFeedback('success', '사주 리포트 요약이 공유되었습니다. (생년월일·시간 원본 미포함)');
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback to clipboard copy
    await handleCopyLink();
  };

  const handleCopyLink = async () => {
    onShareEvent('click');
    const shareText = buildPrivacySafeShareText();
    try {
      await navigator.clipboard.writeText(shareText);
      onShareEvent('success');
      showFeedback(
        'success',
        '개인정보를 제외한 사주 요약과 서비스 링크가 클립보드에 복사되었습니다.'
      );
    } catch {
      showFeedback('error', '클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const handleDownloadCard = async () => {
    onShareEvent('click');
    setIsDownloadingCard(true);
    try {
      await downloadSajuCardImage(result);
      onShareEvent('success');
      showFeedback(
        'success',
        '사주 결과 카드 이미지(PNG)가 저장되었습니다. (생년월일·시간 미포함)'
      );
    } catch {
      showFeedback('error', '결과 카드 이미지를 생성하지 못했습니다.');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const sectionsList = [
    {
      id: 'sec-overall',
      chapter: '01',
      kicker: '종합 사주 풀이',
      heading: '당신의 사주를 읽다',
      content: report.sections.overall.content,
      isLead: true,
    },
    {
      id: 'sec-personality',
      chapter: '02',
      kicker: '성격운',
      heading: '당신은 어떤 사람인가요?',
      content: report.sections.personality.content,
    },
    {
      id: 'sec-wealth',
      chapter: '03',
      kicker: '재물운',
      heading: '돈과 기회가 흐르는 방향',
      content: report.sections.wealth.content,
      footnote: '재물운은 금전적 태도와 기회 활용에 대한 참고 해석이며 특정 투자 결과를 예측하지 않습니다.',
    },
    {
      id: 'sec-love',
      chapter: '04',
      kicker: '연애운',
      heading: '사랑을 대하는 당신의 방식',
      content: report.sections.love.content,
    },
    {
      id: 'sec-health',
      chapter: '05',
      kicker: '건강운',
      heading: '몸과 마음의 균형',
      content: report.sections.health.content,
      footnote: '건강운은 오행 균형에 기반한 생활 습관 및 자기 성찰용 콘텐츠이며 의학적 진단이나 치료를 대체하지 않습니다.',
    },
    {
      id: 'sec-yearly',
      chapter: '06',
      kicker: `${targetYear}년 운세`,
      heading: `${targetYear}년, 당신에게 찾아올 흐름`,
      content: report.sections.yearly.content,
    },
  ];

  return (
    <article className="mx-auto max-w-[1040px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* A. Result Intro */}
      <motion.header
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="border-b border-[#4B4030]/60 pb-10 text-center"
      >
        <p className="text-xs tracking-[0.22em] text-[#C6A76A]">개인화 사주 리포트</p>
        <h1 className="font-serif-kr mt-4 text-balance text-3xl font-semibold text-[#F3EFE5] sm:text-4xl lg:text-5xl">
          {nickname}님의 사주 리포트
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-[#A9A396]">
          태어난 순간의 기운을 바탕으로 당신의 이야기를 풀어보았습니다.
        </p>

        {/* Clean Unboxed Metadata Strip */}
        <div className="tabular-nums mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-[#A9A396]">
          <span className="text-[#F3EFE5]">{displayMeta.birthDateLabel}</span>
          <span aria-hidden="true" className="text-[#4B4030]">·</span>
          <span>{displayMeta.calendarLabel}</span>
          <span aria-hidden="true" className="text-[#4B4030]">·</span>
          <span>{displayMeta.timeLabel}</span>
          <span aria-hidden="true" className="text-[#4B4030]">·</span>
          <span>일간 {calculation.dayMaster.label}</span>
          <span aria-hidden="true" className="text-[#4B4030]">·</span>
          <span>절기 {calculation.calculationMetadata.solarTermContext}</span>
        </div>
      </motion.header>

      {/* B. Four Pillars (사주 8자 카드) */}
      <section className="py-14 border-b border-[#4B4030]/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#C6A76A]">만세력 정밀 계산 결과</p>
            <h2 className="font-serif-kr mt-2 text-2xl font-semibold text-[#F3EFE5] sm:text-3xl">
              당신의 사주팔자
            </h2>
            <p className="mt-2 text-sm text-[#A9A396]">
              태어난 연도, 월, 일, 시간을 네 개의 기둥으로 표현한 당신만의 사주입니다.
            </p>
          </div>
          <p className="text-xs text-[#A9A396]">
            KST 표준시 · 자정 일주 경계 기준
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <PillarCard
            title="연주 (年柱)"
            subTitle="초년 · 가문의 뿌리"
            pillar={calculation.pillars.year}
            index={0}
          />
          <PillarCard
            title="월주 (月柱)"
            subTitle="청년 · 사회적 환경"
            pillar={calculation.pillars.month}
            index={1}
          />
          <PillarCard
            title="일주 (日柱)"
            subTitle="일간(나) · 본연의 기질"
            pillar={calculation.pillars.day}
            isDayPillar
            index={2}
          />
          <PillarCard
            title="시주 (時柱)"
            subTitle="말년 · 결실과 내면"
            pillar={calculation.pillars.hour}
            index={3}
          />
        </div>

        {calculation.calculationMetadata.birthTimeUnknown && (
          <p className="mt-5 text-xs sm:text-sm leading-relaxed text-[#A9A396]">
            태어난 시간이 미상으로 입력되어 시주를 임의로 추정하지 않았습니다. 연주·월주·일주 세 기둥(6자)을 기준으로 해석하므로, 말년운 및 시간대별 세부 기운 해석에는 한계가 있을 수 있습니다.
          </p>
        )}
      </section>

      {/* C. Five Elements Analysis (오행 분석) */}
      <section className="py-14 border-b border-[#4B4030]/50">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#C6A76A]">오행 분포 데이터</p>
          <h2 className="font-serif-kr mt-2 text-2xl font-semibold text-[#F3EFE5] sm:text-3xl">
            당신을 이루는 다섯 가지 기운
          </h2>
          <p className="mt-2 text-sm text-[#A9A396]">
            사주 원국에 나타난 {totalCount}글자를 기준으로 목·화·토·금·수의 비율을 집계했습니다.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-center gap-10 rounded-sm border border-[#4B4030]/70 bg-[#1B1A17] p-6 sm:p-8 lg:grid-cols-12">
          {/* Pentagon Harmony Diagram */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 280 280"
              className="h-64 w-64 sm:h-72 sm:w-72"
              role="img"
              aria-label="목 화 토 금 수 오행 균형 오각형 차트"
            >
              <polygon
                points={pentagonPoints.outerPolygon}
                fill="none"
                stroke="#4B4030"
                strokeWidth="1"
              />
              <polygon
                points={pentagonPoints.midPolygon}
                fill="none"
                stroke="#4B4030"
                strokeWidth="0.75"
                strokeDasharray="3 4"
              />
              {pentagonPoints.vertices.map((v) => (
                <line
                  key={v.key}
                  x1="140"
                  y1="140"
                  x2={v.outerX}
                  y2={v.outerY}
                  stroke="#4B4030"
                  strokeWidth="0.75"
                  strokeOpacity="0.65"
                />
              ))}

              <motion.polygon
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: '140px 140px' }}
                points={pentagonPoints.dataPolygon}
                fill="rgba(198, 167, 106, 0.2)"
                stroke="#C6A76A"
                strokeWidth="1.6"
              />

              {pentagonPoints.vertices.map((v) => {
                const info = ELEMENT_INFO[v.key];
                const count = calculation.fiveElements[v.key];
                return (
                  <g key={v.key}>
                    <circle
                      cx={v.dataX}
                      cy={v.dataY}
                      r="3.5"
                      fill={info.color}
                    />
                    <text
                      x={v.labelX}
                      y={v.labelY}
                      fill={info.color}
                      fontSize="13"
                      fontFamily="'Noto Serif KR', serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {info.kr}({info.hanja}) {count}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Horizontal Bar Breakdown */}
          <div className="lg:col-span-7 space-y-5">
            {ELEMENT_ORDER.map((key, idx) => {
              const info = ELEMENT_INFO[key];
              const count = calculation.fiveElements[key];
              const pct = Math.round((count / totalCount) * 100);

              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="font-serif-kr font-semibold"
                        style={{ color: info.color }}
                      >
                        {info.kr}({info.hanja})
                      </span>
                      <span className="text-xs text-[#A9A396]">{info.meaning}</span>
                    </div>
                    <span className="tabular-nums text-xs sm:text-sm font-medium text-[#F3EFE5] whitespace-nowrap ml-3">
                      {count}개 · {pct}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-[#11110F]">
                    <motion.div
                      initial={shouldReduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: Math.max(0.03, count / totalCount) }}
                      transition={{
                        duration: 0.7,
                        delay: idx * 0.07,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        backgroundColor: info.color,
                        transformOrigin: 'left center',
                      }}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              );
            })}

            <p className="border-t border-[#4B4030]/50 pt-4 text-sm leading-relaxed text-[#A9A396]">
              {elementSummaryText}
            </p>
          </div>
        </div>
      </section>

      {/* AI Interpretation Chapter Jump Bar */}
      <section className="pt-14">
        <div className="flex flex-col gap-3 border-b border-[#4B4030]/55 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#C6A76A]">AI 개인화 해석 리포트</p>
            <h2 className="font-serif-kr mt-2 text-xl sm:text-2xl font-semibold text-[#F3EFE5]">
              {report.title}
            </h2>
          </div>

          <nav aria-label="리포트 목차" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#A9A396]">
            {sectionsList.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="transition-colors hover:text-[#E2CA91] hover:underline underline-offset-4 whitespace-nowrap"
              >
                {sec.chapter}. {sec.kicker}
              </a>
            ))}
          </nav>
        </div>

        {/* Summary Lead */}
        <div className="mt-8 rounded-sm border border-[#4B4030]/60 bg-[#1B1A17] p-6 sm:p-8">
          <p className="text-xs tracking-[0.18em] text-[#C6A76A]">총평 요약</p>
          <p className="font-serif-kr mt-3 text-base sm:text-lg leading-[1.85] text-[#F3EFE5]">
            {report.summary}
          </p>
        </div>

        {/* D - I: 6 Structured Interpretation Chapters */}
        <div className="divide-y divide-[#4B4030]/45">
          {sectionsList.map((sec, idx) => (
            <motion.section
              key={sec.id}
              id={sec.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.03 }}
              className="py-12 scroll-mt-20"
            >
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <p className="tabular-nums text-xs tracking-[0.2em] text-[#C6A76A]">
                    {sec.chapter} · {sec.kicker}
                  </p>
                  <h3 className="font-serif-kr mt-2 text-2xl font-semibold leading-snug text-[#F3EFE5]">
                    {sec.heading}
                  </h3>
                </div>

                <div className="lg:col-span-8 max-w-prose space-y-4">
                  {renderParagraphs(sec.content).map((paragraph, pIdx) => (
                    <p
                      key={pIdx}
                      className={`text-sm sm:text-base leading-[1.85] text-[#F3EFE5]/90 ${
                        sec.isLead && pIdx === 0
                          ? 'first-letter:font-serif-kr first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-semibold first-letter:leading-none first-letter:text-[#C6A76A]'
                          : ''
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}

                  {sec.footnote && (
                    <p className="pt-2 text-xs leading-relaxed text-[#A9A396]">
                      {sec.footnote}
                    </p>
                  )}
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        {/* Closing Editorial Pull Quote (No thick left border) */}
        <div className="my-6 border-t border-b border-[#C6A76A]/45 py-10 text-center">
          <p className="text-xs tracking-[0.2em] text-[#C6A76A]">당신에게 전하는 마지막 조언</p>
          <blockquote className="font-serif-kr mx-auto mt-4 max-w-2xl text-lg sm:text-xl leading-[1.85] text-[#E2CA91]">
            “{report.advice}”
          </blockquote>
        </div>
      </section>

      {/* J. Share & Restart Section */}
      <section className="mt-10 rounded-sm border border-[#4B4030]/70 bg-[#1B1A17] p-7 sm:p-10 text-center">
        <h2 className="font-serif-kr text-2xl font-semibold text-[#F3EFE5]">
          당신의 사주 이야기를 공유해보세요.
        </h2>
        <p className="mx-auto mt-2.5 max-w-lg text-xs sm:text-sm text-[#A9A396]">
          개인정보 보호를 위해 공유 문구와 결과 카드 이미지에는 생년월일 및 태어난 시간 원본이 포함되지 않습니다.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleWebShare}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-6 py-2.5 text-sm font-semibold text-[#11110F] transition-all duration-200 hover:bg-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] whitespace-nowrap cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>결과 공유하기</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-[#4B4030] bg-[#11110F] px-5 py-2.5 text-sm font-medium text-[#F3EFE5] transition-colors hover:border-[#C6A76A] hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] whitespace-nowrap cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            <span>링크 복사하기</span>
          </button>

          <button
            type="button"
            disabled={isDownloadingCard}
            onClick={handleDownloadCard}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-[#4B4030] bg-[#11110F] px-5 py-2.5 text-sm font-medium text-[#F3EFE5] transition-colors hover:border-[#C6A76A] hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloadingCard ? '이미지 생성 중...' : '결과 카드 저장'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-sm border border-transparent px-5 py-2.5 text-sm font-medium text-[#A9A396] transition-colors hover:text-[#F3EFE5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>다시 사주 보기</span>
          </button>
        </div>

        {/* Share Status Feedback */}
        <div aria-live="polite" className="mt-5 min-h-[24px]">
          {shareFeedback && (
            <p
              className={`inline-flex items-center gap-2 text-xs sm:text-sm ${
                shareFeedback.type === 'success' ? 'text-[#E2CA91]' : 'text-[#B86B52]'
              }`}
            >
              {shareFeedback.type === 'success' ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{shareFeedback.message}</span>
            </p>
          )}
        </div>
      </section>
    </article>
  );
}
