export type AnalyticsEventName =
  | 'page_view'
  | 'hero_cta_click'
  | 'form_start'
  | 'form_submit'
  | 'saju_calculation_success'
  | 'gemini_request_success'
  | 'result_view'
  | 'share_click'
  | 'share_success'
  | 'retry_click';

export function trackEvent(event: AnalyticsEventName): void {
  try {
    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  } catch {
    // Non-blocking analytics
  }
}
