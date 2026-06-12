/**
 * World-Class Analytics & Conversion Tracking for Hotel Dream Guide
 * Privacy-friendly event tracking optimized for hotel bookings
 */

export type EventCategory =
    | 'booking'
  | 'conference'
  | 'voice_assistant'
  | 'navigation'
  | 'engagement'
  | 'conversion';

export interface AnalyticsEvent {
    category: EventCategory;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
    timestamp: number;
}

export interface ConversionFunnelStep {
    step: string;
    stepNumber: number;
    completed: boolean;
    timestamp?: number;
}

export interface SessionData {
    sessionId: string;
    startTime: number;
    pageViews: number;
    events: AnalyticsEvent[];
    referrer: string;
    device: 'mobile' | 'tablet' | 'desktop';
}

export class HotelAnalytics {
    private session: SessionData;
    private funnel: ConversionFunnelStep[] = [];
    private endpoint: string | null;
    private queue: AnalyticsEvent[] = [];
    private flushInterval = 5000;
    private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(endpoint?: string) {
        this.endpoint = endpoint || null;
        this.session = this.initSession();
        this.startFlushTimer();
  }

  private initSession(): SessionData {
        return {
                sessionId: this.generateSessionId(),
                startTime: Date.now(),
                pageViews: 0,
                events: [],
                referrer: typeof document !== 'undefined' ? document.referrer : '',
                device: this.detectDevice(),
        };
  }

  private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private detectDevice(): 'mobile' | 'tablet' | 'desktop' {
        if (typeof window === 'undefined') return 'desktop';
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
  }

  public track(
        category: EventCategory,
        action: string,
        options?: { label?: string; value?: number; metadata?: Record<string, unknown> }
      ): void {
        const event: AnalyticsEvent = {
                category,
                action,
                label: options?.label,
                value: options?.value,
                metadata: options?.metadata,
                timestamp: Date.now(),
        };
        this.session.events.push(event);
        this.queue.push(event);
  }

  public trackPageView(path: string): void {
        this.session.pageViews++;
        this.track('navigation', 'page_view', { label: path });
  }

  public trackBookingStep(step: string, stepNumber: number): void {
        this.funnel.push({ step, stepNumber, completed: true, timestamp: Date.now() });
        this.track('booking', 'funnel_step', { label: step, value: stepNumber });
  }

  public trackBookingConversion(bookingValue: number, roomType: string): void {
        this.track('conversion', 'booking_complete', {
                label: roomType,
                value: bookingValue,
                metadata: { funnelSteps: this.funnel.length },
        });
  }

  public trackConferenceLead(attendees: number, eventType: string): void {
        this.track('conference', 'lead_generated', { label: eventType, value: attendees });
  }

  public trackVoiceInteraction(intent: string, success: boolean): void {
        this.track('voice_assistant', success ? 'command_success' : 'command_failed', {
                label: intent,
        });
  }

  public trackEngagement(action: string, value?: number): void {
        this.track('engagement', action, { value });
  }

  public getFunnelCompletionRate(totalSteps: number): number {
        const completedSteps = this.funnel.filter((s) => s.completed).length;
        return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }

  public getSessionDuration(): number {
        return Math.floor((Date.now() - this.session.startTime) / 1000);
  }

  public getSessionSummary() {
        return {
                sessionId: this.session.sessionId,
                duration: this.getSessionDuration(),
                pageViews: this.session.pageViews,
                eventCount: this.session.events.length,
                device: this.session.device,
                conversionEvents: this.session.events.filter((e) => e.category === 'conversion').length,
        };
  }

  private startFlushTimer(): void {
        if (typeof window === 'undefined') return;
        this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  public async flush(): Promise<void> {
        if (this.queue.length === 0 || !this.endpoint) return;
        const events = [...this.queue];
        this.queue = [];
        try {
                await fetch(this.endpoint, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionId: this.session.sessionId, events }),
                          keepalive: true,
                });
        } catch (err) {
                this.queue.unshift(...events);
                console.warn('Analytics flush failed:', err);
        }
  }

  public destroy(): void {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flush();
  }
}

let analyticsInstance: HotelAnalytics | null = null;

export function initAnalytics(endpoint?: string): HotelAnalytics {
    if (!analyticsInstance) {
          analyticsInstance = new HotelAnalytics(endpoint);
    }
    return analyticsInstance;
}

export function getAnalytics(): HotelAnalytics | null {
    return analyticsInstance;
}
