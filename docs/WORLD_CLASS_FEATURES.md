# World-Class Features - Hotel Dream Guide

This document describes the world-class feature modules added to elevate the Hotel Dream Guide application. All modules are written in TypeScript with full type safety, error handling, and best practices.

## Overview

Four new core library modules and one React hook power the upgraded experience:

| Module | Path | Purpose |
|--------|------|---------|
| SEO System | `src/lib/seo.ts` | Schema.org structured data & meta tags |
| Voice Assistant | `src/lib/voiceAssistant.ts` | Clara multi-language voice engine |
| Analytics | `src/lib/analytics.ts` | Conversion & engagement tracking |
| Booking Engine | `src/lib/bookingEngine.ts` | Availability, pricing, reservations |
| useClaraVoice | `src/hooks/useClaraVoice.ts` | React hook for voice features |

---

## 1. SEO System (`seo.ts`)

World-class SEO is critical for hotel discoverability. This module generates valid Schema.org JSON-LD structured data that helps Google display rich results.

### Available Schema Generators

- `generateHotelSchema()` - Hotel/LocalBusiness markup for local search
- `generateRoomSchema()` - Room availability rich snippets
- `generateReviewSchema()` - Aggregate ratings for social proof
- `generateConferenceSchema()` - Event markup for the conference feature
- `generateBreadcrumbSchema()` - Site navigation structure
- `generateOrganizationSchema()` - Brand authority signals
- `generateVoiceSearchSchema()` - Voice search optimization

### Meta Tag Generator

`generateMetaTags()` produces a complete set of Open Graph and Twitter Card tags plus mobile optimization tags.

### Example Usage

```typescript
import { generateHotelSchema, schemaToJsonLd } from '@/lib/seo';

const schema = generateHotelSchema({
  name: 'Hotel Dream Guide',
    description: 'Luxury hotel with conference facilities',
      image: ['/hero.jpg'],
        address: {
            streetAddress: 'Musterstrasse 1',
                addressLocality: 'Ingolstadt',
                    addressRegion: 'Bayern',
                        postalCode: '85049',
                            addressCountry: 'DE',
                              },
                                telephone: '+49 841 123456',
                                  email: 'info@hoteldreamguide.de',
                                    url: 'https://hoteldreamguide.de',
                                      priceRange: '$$$',
                                        rating: 4.8,
                                          reviewCount: 245,
                                            amenities: ['WiFi', 'Parking', 'Restaurant', 'Conference Rooms'],
                                              acceptsReservations: true,
                                                starRating: 4,
                                                });
                                                ```

                                                ---

                                                ## 2. Voice Assistant (`voiceAssistant.ts`)

                                                Enhanced Clara voice engine with multi-language support, intelligent command matching, and voice fallbacks (including Bavarian/Austrian/Swiss German).

                                                ### Supported Languages

                                                - German (de-DE) - primary
                                                - Austrian German (de-AT) - with Servus greeting
                                                - Swiss German (de-CH) - with Gruezi greeting
                                                - English (en-US)

                                                ### Features

                                                - Web Speech API integration with browser compatibility checks
                                                - Best-voice selection per language with fallbacks
                                                - Pattern-based command matching
                                                - State subscription system for React integration
                                                - Pre-built hotel commands (booking, availability, conference, reception)

                                                ### Example Usage

                                                ```typescript
                                                import { ClaraVoiceAssistant, createHotelCommands } from '@/lib/voiceAssistant';

                                                const clara = new ClaraVoiceAssistant({ language: 'de-DE' });
                                                clara.registerCommands(createHotelCommands({
                                                  onBookRoom: () => navigate('/booking'),
                                                    onCheckAvailability: () => navigate('/rooms'),
                                                      onConferenceInquiry: () => navigate('/conference'),
                                                        onContactReception: () => navigate('/contact'),
                                                          onShowAmenities: () => navigate('/amenities'),
                                                            onNavigateHome: () => navigate('/'),
                                                            }));
                                                            clara.startListening();
                                                            ```

                                                            ---

                                                            ## 3. Analytics (`analytics.ts`)

                                                            Privacy-friendly analytics optimized for hotel conversion tracking.

                                                            ### Tracking Methods

                                                            - `trackPageView()` - page navigation
                                                            - `trackBookingStep()` - booking funnel progression
                                                            - `trackBookingConversion()` - completed bookings with value
                                                            - `trackConferenceLead()` - conference lead generation
                                                            - `trackVoiceInteraction()` - Clara command success/failure
                                                            - `trackEngagement()` - scroll depth, time on page

                                                            ### Analytics Insights

                                                            - `getFunnelCompletionRate()` - booking funnel conversion rate
                                                            - `getSessionDuration()` - session length
                                                            - `getSessionSummary()` - full session metrics

                                                            ### Example Usage

                                                            ```typescript
                                                            import { initAnalytics } from '@/lib/analytics';

                                                            const analytics = initAnalytics('/api/analytics');
                                                            analytics.trackBookingStep('select_dates', 1);
                                                            analytics.trackBookingConversion(450, 'suite');
                                                            ```

                                                            ---

                                                            ## 4. Booking Engine (`bookingEngine.ts`)

                                                            Complete hotel reservation system with dynamic pricing.

                                                            ### Dynamic Pricing Factors

                                                            - Seasonal multipliers (winter/spring/summer/autumn)
                                                            - Weekend surcharge (25% by default)
                                                            - Early-bird discount (30+ days ahead)
                                                            - Last-minute discount (within 3 days)
                                                            - Length-of-stay discounts (3/7/14 nights)

                                                            ### Core Methods

                                                            - `searchAvailability()` - find available rooms for dates
                                                            - `calculatePrice()` - dynamic pricing calculation
                                                            - `createReservation()` - create a booking with validation
                                                            - `confirmReservation()` - confirm pending booking
                                                            - `getOccupancyRate()` - admin occupancy metrics

                                                            ### Example Usage

                                                            ```typescript
                                                            import { BookingEngine } from '@/lib/bookingEngine';

                                                            const engine = new BookingEngine(rooms);
                                                            const results = engine.searchAvailability({
                                                              checkIn: new Date('2026-07-01'),
                                                                checkOut: new Date('2026-07-05'),
                                                                }, 2);
                                                                ```

                                                                ---

                                                                ## 5. useClaraVoice Hook (`useClaraVoice.ts`)

                                                                React hook that wraps the voice assistant for easy component integration.

                                                                ### Example Usage

                                                                ```tsx
                                                                import { useClaraVoice } from '@/hooks/useClaraVoice';
                                                                import { createHotelCommands } from '@/lib/voiceAssistant';

                                                                function ClaraButton() {
                                                                  const { state, startListening, greet, isSupported } = useClaraVoice({
                                                                      config: { language: 'de-DE' },
                                                                          commands: createHotelCommands({ /* handlers */ }),
                                                                            });

                                                                              if (!isSupported) return <p>Voice not supported</p>;

                                                                                return (
                                                                                    <button onClick={state.isListening ? undefined : startListening}>
                                                                                          {state.isListening ? 'Clara hoert zu...' : 'Clara aktivieren'}
                                                                                              </button>
                                                                                                );
                                                                                                }
                                                                                                ```

                                                                                                ---

                                                                                                ## Integration Checklist

                                                                                                - [ ] Add Hotel schema to homepage `<head>` via Helmet
                                                                                                - [ ] Wire booking engine to Supabase rooms table
                                                                                                - [ ] Connect analytics endpoint to Supabase edge function
                                                                                                - [ ] Replace existing Clara logic with new voice engine
                                                                                                - [ ] Add conference schema to conference pages
                                                                                                - [ ] Configure analytics tracking on all booking steps

                                                                                                ## Performance Notes

                                                                                                All modules are tree-shakeable and have zero external dependencies beyond React (for the hook). The booking engine uses in-memory state and should be backed by Supabase for persistence.
                                                                                                
