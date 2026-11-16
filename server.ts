import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateSaju, SajuValidationError } from './server/sajuEngine.ts';
import { generateSajuReport } from './server/geminiService.ts';
import type { SajuAnalysisResponse, SajuInput } from './src/types/saju.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ANALYTICS_EVENTS = new Set([
  'page_view',
  'hero_cta_click',
  'form_start',
  'form_submit',
  'saju_calculation_success',
  'gemini_request_success',
  'result_view',
  'share_click',
  'share_success',
  'retry_click',
]);

async function createApp() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Privacy-safe non-PII analytics endpoint (PRD §11)
  app.post('/api/analytics/event', (req, res) => {
    const eventName = typeof req.body?.event === 'string' ? req.body.event : '';
    if (!ALLOWED_ANALYTICS_EVENTS.has(eventName)) {
      res.status(400).json({ ok: false });
      return;
    }
    res.status(204).end();
  });

  // Main Saju calculation + Gemini interpretation endpoint
  app.post('/api/saju/analyze', async (req, res) => {
    try {
      const body = req.body as Partial<SajuInput> | undefined;
      if (!body || typeof body !== 'object') {
        res.status(400).json({ error: '요청 데이터가 올바르지 않습니다.' });
        return;
      }

      const sanitizedInput: SajuInput = {
        nickname: typeof body.nickname === 'string' ? body.nickname : '',
        birthDate: typeof body.birthDate === 'string' ? body.birthDate : '',
        calendarType: body.calendarType === 'lunar' ? 'lunar' : 'solar',
        isLeapMonth: Boolean(body.isLeapMonth),
        birthTime: {
          hour: typeof body.birthTime?.hour === 'number' ? body.birthTime.hour : 12,
          minute: typeof body.birthTime?.minute === 'number' ? body.birthTime.minute : 0,
          unknown: Boolean(body.birthTime?.unknown),
        },
        gender:
          body.gender === 'male' || body.gender === 'female' ? body.gender : 'unspecified',
        timezone: 'Asia/Seoul',
      };

      // 1. Deterministic Manseryeok Calculation (no AI guessing)
      const { calculation, displayMeta, normalizedNickname, targetYear } =
        calculateSaju(sanitizedInput);

      // 2. Personalized Gemini AI Interpretation based ONLY on calculated data
      const report = await generateSajuReport({
        nickname: normalizedNickname,
        gender: sanitizedInput.gender,
        calculation,
        targetYear,
      });

      const responsePayload: SajuAnalysisResponse = {
        nickname: normalizedNickname,
        displayMeta,
        calculation,
        report,
        targetYear,
      };

      res.json(responsePayload);
    } catch (err) {
      if (err instanceof SajuValidationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }

      const message =
        err instanceof Error ? err.message : '사주 분석 중 일시적인 오류가 발생했습니다.';
      // Never log sensitive birthDate or birthTime
      console.error('[Saju Analysis Error]', message);
      res.status(500).json({
        error: message.includes('API') || message.includes('GEMINI')
          ? 'AI 해석 서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
