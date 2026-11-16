import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { GoldParticlesCanvas } from './GoldParticlesCanvas';
import { CelestialAstrolabe } from './CelestialAstrolabe';

interface HeroViewProps {
  onStart: () => void;
}

export function HeroView({ onStart }: HeroViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [backdropFailed, setBackdropFailed] = useState(false);
  const heroContainerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroContainerRef,
    offset: ['start start', 'end start'],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 64]);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section
        ref={heroContainerRef}
        className="relative overflow-hidden border-b border-[#4B4030]/45"
      >
        {/* Layered Hanji Ink Backdrop with Parallax + Scrim */}
        <motion.div
          style={shouldReduceMotion ? undefined : { y: parallaxY }}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {!backdropFailed ? (
            <img
              src="/src/assets/images/hero_hanji_ink_backdrop_1794807986126.jpg"
              alt="어두운 한지 위에 금분이 흩뿌려진 먹빛 산수 배경"
              referrerPolicy="no-referrer"
              onError={() => setBackdropFailed(true)}
              className="h-full w-full object-cover opacity-45"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,#24211C_0%,#11110F_70%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#11110F]/65 via-[#11110F]/55 to-[#11110F]" />
        </motion.div>

        <GoldParticlesCanvas mode="ambient" />

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-64px)] max-w-[1200px] grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-20">
          {/* Left Column: Primary Focal Typography & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm tracking-[0.2em] text-[#C6A76A]"
            >
              만세력 기반 개인화 명리 리포트
            </motion.p>

            <motion.h1
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif-kr mt-5 text-balance text-4xl font-semibold leading-[1.28] tracking-tight text-[#F3EFE5] sm:text-5xl lg:text-[3.5rem]"
            >
              태어난 순간에 담긴
              <br />
              나만의 운명을 읽다.
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-base sm:text-lg leading-[1.75] text-[#A9A396]"
            >
              생년월일에 담긴 시간의 흐름을 따라
              <br className="hidden sm:inline" /> AI가 당신의 사주를 깊이 있게 해석합니다.
            </motion.p>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              <button
                type="button"
                onClick={onStart}
                className="group inline-flex min-h-[48px] items-center gap-3 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#11110F] transition-all duration-200 hover:bg-[#E2CA91] hover:shadow-[0_0_28px_rgba(198,167,106,0.34)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>내 사주 보기</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <a
                href="#methodology"
                className="text-sm text-[#A9A396] underline-offset-4 transition-colors duration-150 hover:text-[#E2CA91] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A76A]"
              >
                계산 기준 살펴보기
              </a>
            </motion.div>

            {/* Unboxed Editorial Metadata Line */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.36 }}
              className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#4B4030]/50 pt-5 text-xs sm:text-sm text-[#A9A396]"
            >
              <span>비로그인 즉시 이용 가능</span>
              <span aria-hidden="true" className="text-[#4B4030]">·</span>
              <span>24절기 만세력 계산</span>
              <span aria-hidden="true" className="text-[#4B4030]">·</span>
              <span>로그인 시 개인 보관함 저장</span>
            </motion.div>
          </div>

          {/* Right Column: Rotating Stems & Branches Celestial Astrolabe */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col items-center justify-center"
          >
            <CelestialAstrolabe size="hero" />
            <p className="mt-4 text-center text-xs tracking-widest text-[#A9A396]">
              十干 · 十二支 · 陰陽五行
            </p>
          </motion.div>
        </div>
      </section>

      {/* Editorial 3-Step Overview Section */}
      <section
        id="overview"
        className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.2em] text-[#C6A76A]">서비스 구성</p>
          <h2 className="font-serif-kr mt-3 text-balance text-2xl font-semibold text-[#F3EFE5] sm:text-3xl">
            전통 명리학의 엄밀함과 현대적인 문장의 만남
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#A9A396]">
            생년월일과 시간의 좌표를 만세력으로 정확히 산출하고, 복잡한 명리 용어를 오늘의 언어로 정갈하게 풀어냅니다.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="rounded-sm border border-[#4B4030]/60 bg-[#1B1A17] p-7">
            <p className="font-serif-kr text-sm text-[#C6A76A]">01. 만세력 정밀 산출</p>
            <h3 className="font-serif-kr mt-3 text-lg font-semibold text-[#F3EFE5]">
              추측 없는 사주 8자 계산
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#A9A396]">
              AI가 사주팔자를 임의로 추측하지 않습니다. 양력·음력 윤달 변환과 입춘을 비롯한 24절기 경계를 만세력 엔진이 직접 계산합니다.
            </p>
          </article>

          <article className="rounded-sm border border-[#4B4030]/60 bg-[#1B1A17] p-7">
            <p className="font-serif-kr text-sm text-[#C6A76A]">02. 오행 균형 분석</p>
            <h3 className="font-serif-kr mt-3 text-lg font-semibold text-[#F3EFE5]">
              목·화·토·금·수의 조화
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#A9A396]">
              산출된 천간과 지지의 오행 분포를 시각화하여, 타고난 기운의 균형과 보완이 필요한 지점을 한눈에 살필 수 있습니다.
            </p>
          </article>

          <article className="rounded-sm border border-[#4B4030]/60 bg-[#1B1A17] p-7">
            <p className="font-serif-kr text-sm text-[#C6A76A]">03. 개인화 사주 리포트</p>
            <h3 className="font-serif-kr mt-3 text-lg font-semibold text-[#F3EFE5]">
              여섯 가지 흐름으로 읽는 삶
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#A9A396]">
              종합 풀이, 성격운, 재물운, 연애운, 건강운, 그리고 올해의 운세까지 한 편의 개인화된 에세이처럼 읽어보세요.
            </p>
          </article>
        </div>
      </section>

      {/* Calculation Methodology & Privacy Section */}
      <section
        id="methodology"
        className="border-t border-[#4B4030]/45 bg-[#1B1A17]/55"
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#C6A76A]">만세력 계산 기준</p>
            <h2 className="font-serif-kr mt-3 text-xl sm:text-2xl font-semibold text-[#F3EFE5]">
              명확하고 일관된 역법 정책
            </h2>
            <dl className="mt-6 divide-y divide-[#4B4030]/45 border-t border-b border-[#4B4030]/45 text-sm">
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="text-[#A9A396]">시간대 기준</dt>
                <dd className="col-span-2 text-[#F3EFE5]">대한민국 표준시 (KST, Asia/Seoul)</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="text-[#A9A396]">연주·월주 경계</dt>
                <dd className="col-span-2 text-[#F3EFE5]">입춘 및 12절기 실제 절입 시각 기준</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="text-[#A9A396]">일주 경계 정책</dt>
                <dd className="col-span-2 text-[#F3EFE5]">자정(00:00) 기준 일주 전환 · 야자시 분리</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3.5">
                <dt className="text-[#A9A396]">출생 시간 미상</dt>
                <dd className="col-span-2 text-[#F3EFE5]">시주를 임의 생성하지 않고 삼주(6자)로 분석</dd>
              </div>
            </dl>
          </div>

          <div id="privacy">
            <p className="text-xs tracking-[0.2em] text-[#C6A76A]">개인정보 보호 및 안내</p>
            <h2 className="font-serif-kr mt-3 text-xl sm:text-2xl font-semibold text-[#F3EFE5]">
              머무르지 않고 지나가는 기록
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#A9A396]">
              <p>
                시율은 별도의 회원가입 없이 즉시 이용할 수 있으며, Google 계정으로 로그인하면 계산된 사주 리포트를 본인만 열람 가능한 개인 보관함에 안전하게 저장해 언제든 다시 꺼내볼 수 있습니다.
              </p>
              <p>
                AI 해석 단계에서는 계산된 사주 8자와 오행 균형 등 최소한의 정보만을 전달하며, 저장된 사주 기록은 본인 외 타인이 접근하거나 열람할 수 없도록 엄격히 보호됩니다.
              </p>
              <p>
                제공되는 재물운 및 건강운 등 모든 해석은 전통 명리학을 바탕으로 한 자기 성찰 및 오락 목적의 참고 콘텐츠이며, 의학적 진단이나 재정적 투자 자문을 대신하지 않습니다.
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-[#C6A76A]/70 bg-transparent px-6 py-2.5 text-sm font-medium text-[#E2CA91] transition-colors duration-200 hover:bg-[#C6A76A]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] whitespace-nowrap cursor-pointer"
              >
                <span>사주 정보 입력하기</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#4B4030]/45 bg-[#11110F]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-[#A9A396] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-serif-kr text-sm text-[#F3EFE5]">시율 時律</p>
          <p>전통 명리학과 AI 기술이 함께 풀어내는 개인화 사주 아카이브 · 오락 및 자기 성찰 목적</p>
        </div>
      </footer>
    </div>
  );
}
