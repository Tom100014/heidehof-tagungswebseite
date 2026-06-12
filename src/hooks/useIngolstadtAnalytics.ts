import { useEffect } from 'react';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: string;
  sessionId: string;
  userAgent: string;
  referrer: string;
}

export const useIngolstadtAnalytics = () => {
  const sessionId = (() => {
    let id = sessionStorage.getItem('ingolstadt-session-id');
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('ingolstadt-session-id', id);
    }
    return id;
  })();

  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    const event: AnalyticsEvent = {
      action,
      category,
      label,
      value,
      timestamp: new Date().toISOString(),
      sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Store in localStorage for batch sending
    const events = JSON.parse(localStorage.getItem('ingolstadt-analytics') || '[]');
    events.push(event);
    
    // Keep only last 100 events to prevent storage bloat
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('ingolstadt-analytics', JSON.stringify(events));

    // Log for debugging
    console.log('📊 Analytics Event:', event);
  };

  const trackPageView = (page: string, category?: string) => {
    trackEvent('page_view', 'navigation', `${page}${category ? `-${category}` : ''}`);
  };

  const trackCategoryChange = (newCategory: string, previousCategory: string) => {
    trackEvent('category_change', 'user_interaction', `${previousCategory}->${newCategory}`);
  };

  const trackEventClick = (eventTitle: string, category: string, action: 'details' | 'map' | 'favorite') => {
    trackEvent('event_click', 'engagement', `${action}:${eventTitle}`, 1);
  };

  const trackSearchPerformance = (category: string, eventCount: number, loadTime: number) => {
    trackEvent('search_performance', 'api', category, eventCount);
    trackEvent('load_time', 'performance', category, Math.round(loadTime));
  };

  const trackConversion = (type: 'hotel_link' | 'phone_call' | 'booking_intent') => {
    trackEvent('conversion', 'business', type, 1);
  };

  const trackError = (errorType: string, category: string, details?: string) => {
    trackEvent('error', 'system', `${errorType}:${category}:${details || 'unknown'}`);
  };

  // Send analytics data periodically
  const sendAnalytics = async () => {
    const events = JSON.parse(localStorage.getItem('ingolstadt-analytics') || '[]');
    if (events.length === 0) return;

    try {
      // In a real implementation, you would send this to your analytics endpoint
      console.log('📈 Sending analytics batch:', events.length, 'events');
      
      // For demo purposes, we'll just log aggregated data
      const categoryViews = events
        .filter(e => e.action === 'page_view')
        .reduce((acc, e) => {
          const category = e.label?.split('-')[1] || 'unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const conversions = events.filter(e => e.category === 'business').length;
      const errors = events.filter(e => e.category === 'system').length;

      console.log('📊 Analytics Summary:', {
        totalEvents: events.length,
        categoryViews,
        conversions,
        errors,
        sessionId
      });

      // Clear sent events
      localStorage.removeItem('ingolstadt-analytics');
    } catch (error) {
      console.warn('📉 Analytics send failed:', error);
    }
  };

  // Send analytics on page unload
  useEffect(() => {
    const handleUnload = () => {
      sendAnalytics();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    // Also send every 5 minutes
    const interval = setInterval(sendAnalytics, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(interval);
    };
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackCategoryChange,
    trackEventClick,
    trackSearchPerformance,
    trackConversion,
    trackError,
    sessionId
  };
};
