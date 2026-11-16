import { useEffect, useRef, useState } from 'react';
import { Header, type AppPage } from './components/Header';
import { HeroView } from './components/HeroView';
import { SajuInputForm } from './components/SajuInputForm';
import { LoadingView } from './components/LoadingView';
import { ResultView } from './components/ResultView';
import { trackEvent } from './utils/analytics';
import type { SajuAnalysisResponse, SajuInput } from './types/saju';

const DEFAULT_INPUT: SajuInput = {
  nickname: '',
  birthDate: '1995-05-15',
  calendarType: 'solar',
  isLeapMonth: false,
  birthTime: {
    hour: 12,
    minute: 0,
    unknown: false,
  },
  gender: 'unspecified',
  timezone: 'Asia/Seoul',
};

export default function App() {
  const [page, setPage] = useState<AppPage>('hero');
  const [formInput, setFormInput] = useState<SajuInput>(DEFAULT_INPUT);
  const [analysisResult, setAnalysisResult] = useState<SajuAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    trackEvent('page_view');
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartSaju = () => {
    trackEvent('hero_cta_click');
    setAnalysisError(null);
    setPage('input');
    scrollToTop();
  };

  const handleNavigateHome = () => {
    setPage('hero');
    scrollToTop();
  };

  const handleJumpSection = (sectionId: string) => {
    if (page !== 'hero') {
      setPage('hero');
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const runAnalysis = async (inputPayload: SajuInput) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setFormInput(inputPayload);
    setAnalysisError(null);
    setPage('loading');
    scrollToTop();

    try {
      const response = await fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputPayload),
      });

      const data = (await response.json()) as Partial<SajuAnalysisResponse> & {
        error?: string;
      };

      if (!response.ok || !data.calculation || !data.report) {
        throw new Error(
          data.error || '사주 풀이 생성 중 일시적인 문제가 발생했습니다.'
        );
      }

      trackEvent('saju_calculation_success');
      trackEvent('gemini_request_success');
      setAnalysisResult(data as SajuAnalysisResponse);
      setPage('result');
      trackEvent('result_view');
      scrollToTop();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '네트워크 연결 상태를 확인한 뒤 다시 시도해주세요.';
      setAnalysisError(message);
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleSubmitForm = (inputPayload: SajuInput) => {
    trackEvent('form_submit');
    void runAnalysis(inputPayload);
  };

  const handleRetry = () => {
    trackEvent('retry_click');
    void runAnalysis(formInput);
  };

  const handleRestart = () => {
    setAnalysisError(null);
    setPage('input');
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-[#11110F] text-[#F3EFE5]">
      <Header
        currentPage={page}
        onNavigateHome={handleNavigateHome}
        onStartSaju={handleStartSaju}
        onJumpSection={handleJumpSection}
      />

      <main>
        {page === 'hero' && <HeroView onStart={handleStartSaju} />}

        {page === 'input' && (
          <SajuInputForm
            initialValue={formInput}
            isSubmitting={inFlightRef.current}
            onBack={handleNavigateHome}
            onFormStart={() => trackEvent('form_start')}
            onSubmit={handleSubmitForm}
          />
        )}

        {page === 'loading' && (
          <LoadingView
            error={analysisError}
            onRetry={handleRetry}
            onEditInput={() => {
              setAnalysisError(null);
              setPage('input');
              scrollToTop();
            }}
          />
        )}

        {page === 'result' && analysisResult && (
          <ResultView
            result={analysisResult}
            onRestart={handleRestart}
            onShareEvent={(phase) =>
              trackEvent(phase === 'click' ? 'share_click' : 'share_success')
            }
          />
        )}
      </main>
    </div>
  );
}
