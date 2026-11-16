import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Bookmark,
  LogIn,
  LogOut,
  Check,
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import type { CalendarType, Gender, SajuInput } from '../types/saju';

interface SajuInputFormProps {
  initialValue: SajuInput;
  isSubmitting: boolean;
  onBack: () => void;
  onFormStart: () => void;
  onSubmit: (input: SajuInput, shouldSave: boolean) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1919 }, (_, idx) => CURRENT_YEAR - idx);
const MONTHS = Array.from({ length: 12 }, (_, idx) => idx + 1);
const DAYS = Array.from({ length: 31 }, (_, idx) => idx + 1);
const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const MINUTES = Array.from({ length: 60 }, (_, idx) => idx);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function SajuInputForm({
  initialValue,
  isSubmitting,
  onBack,
  onFormStart,
  onSubmit,
}: SajuInputFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    user,
    authReady,
    authBusy,
    authError,
    signInWithGoogle,
    signOutUser,
    clearAuthError,
  } = useFirebase();

  const [hasStarted, setHasStarted] = useState(false);

  const initialParts = useMemo(() => {
    const [y, m, d] = (initialValue.birthDate || '1995-05-15').split('-').map(Number);
    return {
      year: y || 1995,
      month: m || 5,
      day: d || 15,
    };
  }, [initialValue.birthDate]);

  const [nickname, setNickname] = useState(initialValue.nickname);
  const [calendarType, setCalendarType] = useState<CalendarType>(initialValue.calendarType);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(initialValue.isLeapMonth);
  const [year, setYear] = useState<number>(initialParts.year);
  const [month, setMonth] = useState<number>(initialParts.month);
  const [day, setDay] = useState<number>(initialParts.day);
  const [hour, setHour] = useState<number>(initialValue.birthTime.hour);
  const [minute, setMinute] = useState<number>(initialValue.birthTime.minute);
  const [timeUnknown, setTimeUnknown] = useState<boolean>(initialValue.birthTime.unknown);
  const [gender, setGender] = useState<Gender>(initialValue.gender);
  const [saveChoice, setSaveChoice] = useState<'guest' | 'save'>(
    user ? 'save' : 'guest'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (authReady && user) {
      setSaveChoice('save');
    }
  }, [authReady, user]);

  const markStarted = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onFormStart();
    }
  };

  const handleCalendarChange = (nextType: CalendarType) => {
    markStarted();
    setCalendarType(nextType);
    if (nextType === 'solar') {
      setIsLeapMonth(false);
    }
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || authBusy) return;

    setValidationError(null);
    clearAuthError();

    if (!year || !month || !day) {
      setValidationError('생년월일을 모두 선택해주세요.');
      return;
    }

    if (calendarType === 'solar') {
      const check = new Date(Date.UTC(year, month - 1, day));
      if (
        check.getUTCFullYear() !== year ||
        check.getUTCMonth() + 1 !== month ||
        check.getUTCDate() !== day
      ) {
        setValidationError(`${year}년 ${month}월 ${day}일은 존재하지 않는 날짜입니다.`);
        return;
      }

      const kstTodayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const [todayY, todayM, todayD] = kstTodayStr.split('-').map(Number);
      const selectedNum = year * 10000 + month * 100 + day;
      const todayNum = todayY * 10000 + todayM * 100 + todayD;
      if (selectedNum > todayNum) {
        setValidationError('미래의 날짜는 입력할 수 없습니다.');
        return;
      }
    }

    let shouldSave = saveChoice === 'save';

    if (shouldSave && !user) {
      const signedInUser = await signInWithGoogle();
      if (!signedInUser) {
        return;
      }
      shouldSave = true;
    }

    const birthDate = `${year}-${pad2(month)}-${pad2(day)}`;
    onSubmit(
      {
        nickname: nickname.trim(),
        birthDate,
        calendarType,
        isLeapMonth: calendarType === 'lunar' ? isLeapMonth : false,
        birthTime: {
          hour: timeUnknown ? 12 : hour,
          minute: timeUnknown ? 0 : minute,
          unknown: timeUnknown,
        },
        gender,
        timezone: 'Asia/Seoul',
      },
      shouldSave
    );
  };

  const combinedError = validationError || authError;

  return (
    <section className="mx-auto max-w-[780px] px-4 py-12 sm:px-6 lg:py-16">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[40px] items-center gap-2 text-sm text-[#A9A396] transition-colors duration-150 hover:text-[#E2CA91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A76A] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>메인으로 돌아가기</span>
      </button>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <p className="text-xs tracking-[0.2em] text-[#C6A76A]">사주 정보 입력</p>
        <h1 className="font-serif-kr mt-3 text-balance text-3xl font-semibold text-[#F3EFE5] sm:text-4xl">
          당신이 태어난 시간을 알려주세요.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#A9A396]">
          태어난 순간의 정보로 당신만의 사주를 분석합니다.
        </p>
      </motion.div>

      <motion.form
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="hanji-texture mt-8 rounded-sm border border-[#4B4030]/75 bg-[#1B1A17] p-6 sm:p-10"
      >
        <div className="space-y-8">
          {/* 1. Nickname */}
          <div>
            <label
              htmlFor="saju-nickname"
              className="block text-sm font-medium text-[#F3EFE5]"
            >
              이름 또는 닉네임 <span className="text-xs font-normal text-[#A9A396]">(선택)</span>
            </label>
            <input
              id="saju-nickname"
              type="text"
              maxLength={24}
              value={nickname}
              onChange={(e) => {
                markStarted();
                setNickname(e.target.value);
              }}
              placeholder="이름 또는 닉네임을 입력해주세요."
              className="mt-2.5 block min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-4 py-2.5 text-sm sm:text-base text-[#F3EFE5] placeholder:text-[#A9A396]/55 transition-colors focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A]"
            />
            <p className="mt-2 text-xs text-[#A9A396]">
              입력하지 않으시면 리포트에서 ‘당신’으로 표기됩니다.
            </p>
          </div>

          {/* 2. Calendar Type & Leap Month */}
          <div>
            <span className="block text-sm font-medium text-[#F3EFE5]">
              달력 유형 <span className="text-xs font-normal text-[#C6A76A]">(필수)</span>
            </span>
            <div
              role="group"
              aria-label="달력 유형 선택"
              className="mt-2.5 grid grid-cols-2 gap-2 rounded-sm border border-[#4B4030] bg-[#11110F] p-1"
            >
              <button
                type="button"
                onClick={() => handleCalendarChange('solar')}
                className={`min-h-[42px] rounded-sm px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#C6A76A] cursor-pointer ${
                  calendarType === 'solar'
                    ? 'bg-[#C6A76A] text-[#11110F]'
                    : 'text-[#A9A396] hover:text-[#F3EFE5]'
                }`}
              >
                양력
              </button>
              <button
                type="button"
                onClick={() => handleCalendarChange('lunar')}
                className={`min-h-[42px] rounded-sm px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#C6A76A] cursor-pointer ${
                  calendarType === 'lunar'
                    ? 'bg-[#C6A76A] text-[#11110F]'
                    : 'text-[#A9A396] hover:text-[#F3EFE5]'
                }`}
              >
                음력
              </button>
            </div>

            {calendarType === 'lunar' && (
              <div className="mt-4 flex flex-col gap-3 rounded-sm border border-[#4B4030]/60 bg-[#24211C]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#F3EFE5]">윤달 여부</p>
                  <p className="mt-0.5 text-xs text-[#A9A396]">
                    음력 생일이 윤달에 해당하는지 선택해주세요.
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="음력 평달/윤달 선택"
                  className="inline-grid grid-cols-2 gap-1 rounded-sm border border-[#4B4030] bg-[#11110F] p-1 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      markStarted();
                      setIsLeapMonth(false);
                      setValidationError(null);
                    }}
                    className={`min-h-[38px] rounded-sm px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      !isLeapMonth
                        ? 'bg-[#C6A76A] text-[#11110F]'
                        : 'text-[#A9A396] hover:text-[#F3EFE5]'
                    }`}
                  >
                    평달
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markStarted();
                      setIsLeapMonth(true);
                      setValidationError(null);
                    }}
                    className={`min-h-[38px] rounded-sm px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isLeapMonth
                        ? 'bg-[#C6A76A] text-[#11110F]'
                        : 'text-[#A9A396] hover:text-[#F3EFE5]'
                    }`}
                  >
                    윤달
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Birth Date (Year / Month / Day) */}
          <div>
            <span className="block text-sm font-medium text-[#F3EFE5]">
              생년월일 <span className="text-xs font-normal text-[#C6A76A]">(필수)</span>
            </span>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="birth-year" className="sr-only">
                  태어난 연도
                </label>
                <select
                  id="birth-year"
                  value={year}
                  onChange={(e) => {
                    markStarted();
                    setYear(Number(e.target.value));
                    setValidationError(null);
                  }}
                  className="tabular-nums min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2.5 text-sm sm:text-base text-[#F3EFE5] focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A]"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="birth-month" className="sr-only">
                  태어난 월
                </label>
                <select
                  id="birth-month"
                  value={month}
                  onChange={(e) => {
                    markStarted();
                    setMonth(Number(e.target.value));
                    setValidationError(null);
                  }}
                  className="tabular-nums min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2.5 text-sm sm:text-base text-[#F3EFE5] focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A]"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {isLeapMonth && calendarType === 'lunar' ? `윤${m}월` : `${m}월`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="birth-day" className="sr-only">
                  태어난 일
                </label>
                <select
                  id="birth-day"
                  value={day}
                  onChange={(e) => {
                    markStarted();
                    setDay(Number(e.target.value));
                    setValidationError(null);
                  }}
                  className="tabular-nums min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2.5 text-sm sm:text-base text-[#F3EFE5] focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A]"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}일
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Birth Time & Unknown Toggle */}
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[#F3EFE5]">
                태어난 시간 <span className="text-xs font-normal text-[#A9A396]">(선택 · 24시간 기준)</span>
              </span>

              <label className="inline-flex min-h-[36px] items-center gap-2.5 text-sm text-[#E2CA91] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    markStarted();
                    setTimeUnknown(e.target.checked);
                  }}
                  className="h-4 w-4 rounded-sm border border-[#C6A76A] bg-[#11110F] accent-[#C6A76A]"
                />
                <span>태어난 시간을 모릅니다</span>
              </label>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="birth-hour" className="sr-only">
                  태어난 시
                </label>
                <select
                  id="birth-hour"
                  disabled={timeUnknown}
                  value={hour}
                  onChange={(e) => {
                    markStarted();
                    setHour(Number(e.target.value));
                  }}
                  className="tabular-nums min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2.5 text-sm sm:text-base text-[#F3EFE5] focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {pad2(h)}시
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="birth-minute" className="sr-only">
                  태어난 분
                </label>
                <select
                  id="birth-minute"
                  disabled={timeUnknown}
                  value={minute}
                  onChange={(e) => {
                    markStarted();
                    setMinute(Number(e.target.value));
                  }}
                  className="tabular-nums min-h-[46px] w-full rounded-sm border border-[#4B4030] bg-[#11110F] px-3.5 py-2.5 text-sm sm:text-base text-[#F3EFE5] focus:border-[#C6A76A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A76A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {pad2(m)}분
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {timeUnknown && (
              <p className="mt-2.5 text-xs leading-relaxed text-[#A9A396]">
                시간을 모를 경우 시주(時柱)를 임의로 생성하지 않고, 연주·월주·일주 삼주(6자)를 기준으로 정직하게 해석합니다.
              </p>
            )}
          </div>

          {/* 5. Gender */}
          <div>
            <span className="block text-sm font-medium text-[#F3EFE5]">
              성별 <span className="text-xs font-normal text-[#A9A396]">(선택)</span>
            </span>
            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  { value: 'male', label: '남성' },
                  { value: 'female', label: '여성' },
                  { value: 'unspecified', label: '선택하지 않음' },
                ] as const
              ).map((option) => {
                const selected = gender === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex min-h-[46px] items-center justify-center rounded-sm border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#C6A76A] bg-[#24211C] text-[#E2CA91]'
                        : 'border-[#4B4030]/80 bg-[#11110F] text-[#A9A396] hover:border-[#C6A76A]/50 hover:text-[#F3EFE5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={selected}
                      onChange={() => {
                        markStarted();
                        setGender(option.value);
                      }}
                      className="sr-only"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#A9A396]">
              전통 명리학의 대운 흐름 참고 외에 성별만으로 성향이나 관계를 단정하지 않습니다.
            </p>
          </div>

          {/* 6. Save & Login Choice */}
          <div className="border-t border-[#4B4030]/55 pt-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[#F3EFE5]">
                결과 저장 및 로그인 선택
              </span>

              {authReady && user && (
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-[#E2CA91]">
                    <Check className="h-3.5 w-3.5" />
                    <span>{user.displayName || '사용자'}님 로그인됨</span>
                  </span>
                  <span aria-hidden="true" className="text-[#4B4030]">·</span>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => {
                      void signOutUser().then(() => setSaveChoice('guest'));
                    }}
                    className="inline-flex items-center gap-1 text-[#A9A396] underline-offset-4 hover:text-[#F3EFE5] hover:underline cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`flex flex-col justify-between rounded-sm border p-4 transition-colors cursor-pointer ${
                  saveChoice === 'save'
                    ? 'border-[#C6A76A] bg-[#24211C]'
                    : 'border-[#4B4030]/80 bg-[#11110F] hover:border-[#C6A76A]/50'
                }`}
              >
                <input
                  type="radio"
                  name="savePreference"
                  value="save"
                  checked={saveChoice === 'save'}
                  onChange={() => {
                    markStarted();
                    clearAuthError();
                    setSaveChoice('save');
                  }}
                  className="sr-only"
                />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#F3EFE5]">
                    <Bookmark className="h-4 w-4 text-[#C6A76A] shrink-0" />
                    <span>로그인하고 내 보관함에 저장하기</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#A9A396]">
                    {user
                      ? '분석 완료 후 내 보관함에 자동 저장되어 언제든 다시 열어보고 메모할 수 있습니다.'
                      : 'Google 계정으로 로그인하여 이번 사주 리포트를 개인 보관함에 저장합니다.'}
                  </p>
                </div>
              </label>

              <label
                className={`flex flex-col justify-between rounded-sm border p-4 transition-colors cursor-pointer ${
                  saveChoice === 'guest'
                    ? 'border-[#C6A76A] bg-[#24211C]'
                    : 'border-[#4B4030]/80 bg-[#11110F] hover:border-[#C6A76A]/50'
                }`}
              >
                <input
                  type="radio"
                  name="savePreference"
                  value="guest"
                  checked={saveChoice === 'guest'}
                  onChange={() => {
                    markStarted();
                    clearAuthError();
                    setSaveChoice('guest');
                  }}
                  className="sr-only"
                />
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#F3EFE5]">
                    <span>저장하지 않고 바로 보기</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#A9A396]">
                    {user
                      ? '로그인 상태이지만 이번 결과는 보관함에 남기지 않고 현재 화면에서만 확인합니다.'
                      : '별도 로그인이나 계정 저장 없이 이번 세션에서만 즉시 결과를 확인합니다.'}
                  </p>
                </div>
              </label>
            </div>

            {saveChoice === 'save' && authReady && !user && (
              <div className="mt-3 flex flex-col gap-3 rounded-sm border border-[#4B4030]/70 bg-[#11110F]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-[#A9A396]">
                  미리 Google 계정을 연결하거나, 아래 분석 시작 버튼을 누를 때 함께 로그인할 수 있습니다.
                </p>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-sm border border-[#C6A76A]/80 bg-[#1B1A17] px-4 py-2 text-xs font-medium text-[#E2CA91] transition-colors hover:bg-[#24211C] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{authBusy ? '로그인 중...' : 'Google 계정 연결'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Validation or Auth Error Banner */}
          {combinedError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-sm border border-[#B86B52]/70 bg-[#B86B52]/10 p-4 text-sm text-[#F3EFE5]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B86B52]" />
              <span>{combinedError}</span>
            </div>
          )}

          {/* Privacy Notice & Submit */}
          <div className="border-t border-[#4B4030]/55 pt-6">
            <p className="text-xs leading-relaxed text-[#A9A396]">
              {saveChoice === 'save'
                ? '계산된 사주 결과는 본인만 열람 가능한 개인 보관함에 안전하게 저장되며, 원본 생년월일·시각은 AI 서버 로그에 남지 않습니다.'
                : '저장하지 않음을 선택하시면 입력 정보는 만세력 계산과 AI 리포트 작성에만 즉시 사용되며 저장되지 않습니다.'}
            </p>

            <button
              type="submit"
              disabled={isSubmitting || authBusy}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-sm border border-[#C6A76A] bg-[#C6A76A] px-8 py-3.5 text-base font-semibold text-[#11110F] transition-all duration-200 hover:bg-[#E2CA91] hover:shadow-[0_0_24px_rgba(198,167,106,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2CA91] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <span>
                {authBusy
                  ? 'Google 로그인 진행 중...'
                  : saveChoice === 'save' && !user
                    ? 'Google 로그인 후 사주 분석하기'
                    : '내 사주 분석하기'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.form>
    </section>
  );
}
