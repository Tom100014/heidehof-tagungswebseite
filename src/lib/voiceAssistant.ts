/**
 * World-Class Voice Assistant System for Clara
  * Enhanced multi-language support, command handling, and fallbacks
   * Integrates Web Speech API with Cartesia-style voice features
    */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SupportedLanguage = 'de-DE' | 'en-US' | 'de-AT' | 'de-CH';

export interface VoiceCommand {
  patterns: string[];
    intent: string;
  handler: (params?: Record<string, string>) => void | Promise<void>;
    description: string;
}

  export interface VoiceConfig {
      language: SupportedLanguage;
      continuous: boolean;
      interimResults: boolean;
      maxAlternatives: number;
      voiceName?: string;
      rate: number;
      pitch: number;
      volume: number;
  }

    export interface VoiceState {
        isListening: boolean;
        isSpeaking: boolean;
        transcript: string;
        confidence: number;
        error: string | null;
        lastCommand: string | null;
    }

      // ============================================================================
      // DEFAULT CONFIGURATION
      // ============================================================================

      export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
          language: 'de-DE',
          continuous: true,
          interimResults: true,
          maxAlternatives: 3,
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
      };

      // Bavarian/German fallback voice preferences
      export const VOICE_PREFERENCES: Record<SupportedLanguage, string[]> = {
        'de-DE': ['Google Deutsch', 'Anna', 'Markus', 'Petra'],
        'de-AT': ['Google Deutsch', 'Anna'],
        'de-CH': ['Google Deutsch', 'Anna'],
        'en-US': ['Google US English', 'Samantha', 'Alex'],
      };

      // ============================================================================
      // VOICE ASSISTANT CLASS
      // ============================================================================

      export class ClaraVoiceAssistant {
          private recognition: any = null;
          private synthesis: SpeechSynthesis;
          private config: VoiceConfig;
            private commands: VoiceCommand[] = [];
              private state: VoiceState;
            private stateListeners: Array<(state: VoiceState) => void> = [];
            private availableVoices: SpeechSynthesisVoice[] = [];

            constructor(config: Partial<VoiceConfig> = {}) {
              this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
                    this.synthesis = window.speechSynthesis;
                this.state = {
                        isListening: false,
                        isSpeaking: false,
                        transcript: '',
                        confidence: 0,
                        error: null,
                        lastCommand: null,
                };
                this.initRecognition();
                this.loadVoices();
                }

                  /**
                     * Initialize speech recognition with browser compatibility
                        */
                private initRecognition(): void {
                      const SpeechRecognition =
                  (window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition;

                  if (!SpeechRecognition) {
                    this.updateState({ error: 'Speech recognition not supported in this browser' });
                          return;
                  }

                    this.recognition = new SpeechRecognition();
                      this.recognition.lang = this.config.language;
                            this.recognition.continuous = this.config.continuous;
                                  this.recognition.interimResults = this.config.interimResults;
                                        this.recognition.maxAlternatives = this.config.maxAlternatives;

                                          this.recognition.onresult = (event: any) => {
                                            const result = event.results[event.results.length - 1];
                                            const transcript = result[0].transcript.trim();
                                            const confidence = result[0].confidence;

                                            this.updateState({ transcript, confidence });

                                            if (result.isFinal) {
                                              this.processCommand(transcript);
                                            }
                                          };

                                            this.recognition.onerror = (event: any) => {
                                              this.updateState({ error: `Recognition error: ${event.error}`, isListening: false });
                                            };

                                            this.recognition.onend = () => {
                                              this.updateState({ isListening: false });
                                            };
                                          }

                                            /**
                                               * Load available voices with fallback handling
                                                  */
                                          private loadVoices(): void {
                                            const load = () => {
                                              this.availableVoices = this.synthesis.getVoices();
                                            };
                                            load();
                                            if (this.synthesis.onvoiceschanged !== undefined) {
                                                    this.synthesis.onvoiceschanged = load;
                                            }
                                          }

                                                /**
                                                   * Get the best matching voice for the current language
                                                      */
                                              private getBestVoice(): SpeechSynthesisVoice | null {
                                                const preferences = VOICE_PREFERENCES[this.config.language] || [];
                                                  for (const prefName of preferences) {
                                                    const voice = this.availableVoices.find((v) =>
                                                                                            v.name.includes(prefName)
                                                                                           );
                                                    if (voice) return voice;
                                                  }
                                                        // Fallback to any voice matching the language
                                                    return (
                                                      this.availableVoices.find((v) =>
                                                                                v.lang.startsWith(this.config.language.split('-')[0])
                                                                                  ) || null
                                                                                  );
                                                                                  }

                                                                                    /**
                                                                                       * Register a voice command
                                                                                          */
                                                                                  public registerCommand(command: VoiceCommand): void {
                                                                                    this.commands.push(command);
                                                                                  }

                                                                                    /**
                                                                                       * Register multiple commands at once
                                                                                          */
                                                                                  public registerCommands(commands: VoiceCommand[]): void {
                                                                                    this.commands.push(...commands);
                                                                                  }

                                                                                    /**
                                                                                       * Process recognized command against registered patterns
                                                                                          */
                                                                                  private async processCommand(transcript: string): Promise<void> {
                                                                                    const normalized = transcript.toLowerCase();

                                                                                    for (const command of this.commands) {
                                                                                      for (const pattern of command.patterns) {
                                                                                        if (normalized.includes(pattern.toLowerCase())) {
                                                                                          this.updateState({ lastCommand: command.intent });
                                                                                          try {
                                                                                            await command.handler();
                                                                                          } catch (err) {
                                                                                            this.updateState({ error: `Command handler failed: ${err}` });
                                                                                          }
                                                                                                    return;
                                                                                        }
                                                                                      }
                                                                                      }
                                                                                      }

                                                                                            /**
                                                                                               * Start listening for voice input
                                                                                                  */
                                                                                          public startListening(): void {
                                                                                            if (!this.recognition) {
                                                                                              this.updateState({ error: 'Recognition not available' });
                                                                                                    return;
                                                                                            }
                                                                                              try {
                                                                                                this.recognition.start();
                                                                                                this.updateState({ isListening: true, error: null });
                                                                                              } catch (err) {
                                                                                                this.updateState({ error: `Failed to start: ${err}` });
                                                                                              }
                                                                                          }

                                                                                                /**
                                                                                                   * Stop listening
                                                                                                      */
                                                                                              public stopListening(): void {
                                                                                                if (this.recognition) {
                                                                                                  this.recognition.stop();
                                                                                                  this.updateState({ isListening: false });
                                                                                                }
                                                                                              }

                                                                                                    /**
                                                                                                       * Speak text using TTS with best voice selection
                                                                                                          */
                                                                                                  public speak(text: string, onEnd?: () => void): void {
                                                                                                    if (this.state.isSpeaking) {
                                                                                                      this.synthesis.cancel();
                                                                                                    }
                                                                                                      
                                                                                                      const utterance = new SpeechSynthesisUtterance(text);
                                                                                                    const voice = this.getBestVoice();
                                                                                                    if (voice) utterance.voice = voice;
                                                                                                    
                                                                                                        utterance.lang = this.config.language;
                                                                                                              utterance.rate = this.config.rate;
                                                                                                                    utterance.pitch = this.config.pitch;
                                                                                                                          utterance.volume = this.config.volume;
                                                                                                                            
                                                                                                                            utterance.onstart = () => this.updateState({ isSpeaking: true });
                                                                                                                            utterance.onend = () => {
                                                                                                                              this.updateState({ isSpeaking: false });
                                                                                                                              onEnd?.();
                                                                                                                            };
                                                                                                                            utterance.onerror = () => {
                                                                                                                              this.updateState({ isSpeaking: false, error: 'TTS error' });
                                                                                                                            };
                                                                                                                            
                                                                                                                            this.synthesis.speak(utterance);
                                                                                                                            }
                                                                                                                            
                                                                                                                              /**
                                                                                                                                 * Change language dynamically
                                                                                                                                    */
                                                                                                                            public setLanguage(language: SupportedLanguage): void {
                                                                                                                                  this.config.language = language;
                                                                                                                                    if (this.recognition) {
                                                                                                                                            this.recognition.lang = language;
                                                                                                                                    }
                                                                                                                                    }
                                                                                                                                      
                                                                                                                                        /**
                                                                                                                                           * Subscribe to state changes
                                                                                                                                              */
                                                                                                                                      public subscribe(listener: (state: VoiceState) => void): () => void {
                                                                                                                                        this.stateListeners.push(listener);
                                                                                                                                        return () => {
                                                                                                                                          this.stateListeners = this.stateListeners.filter((l) => l !== listener);
                                                                                                                                        };
                                                                                                                                      }
                                                                                                                                      
                                                                                                                                        /**
                                                                                                                                           * Update internal state and notify listeners
                                                                                                                                              */
                                                                                                                                      private updateState(partial: Partial<VoiceState>): void {
                                                                                                                                        this.state = { ...this.state, ...partial };
                                                                                                                                        this.stateListeners.forEach((listener) => listener(this.state));
                                                                                                                                      }
                                                                                                                                      
                                                                                                                                        /**
                                                                                                                                           * Get current state
                                                                                                                                              */
                                                                                                                                      public getState(): VoiceState {
                                                                                                                                        return { ...this.state };
                                                                                                                                      }
                                                                                                                                      
                                                                                                                                        /**
                                                                                                                                           * Cleanup resources
                                                                                                                                              */
                                                                                                                                      public destroy(): void {
                                                                                                                                        this.stopListening();
                                                                                                                                        this.synthesis.cancel();
                                                                                                                                        this.stateListeners = [];
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                      
                                                                                                                                      // ============================================================================
                                                                                                                                      // HOTEL-SPECIFIC VOICE COMMANDS
                                                                                                                                      // ============================================================================
                                                                                                                                      
                                                                                                                                      /**
                                                                                                                                       * Pre-built hotel voice commands for Clara
                                                                                                                                        */
                                                                                                                                      export function createHotelCommands(handlers: {
                                                                                                                                        onBookRoom: () => void;
                                                                                                                                        onCheckAvailability: () => void;
                                                                                                                                        onConferenceInquiry: () => void;
                                                                                                                                        onContactReception: () => void;
                                                                                                                                        onShowAmenities: () => void;
                                                                                                                                        onNavigateHome: () => void;
                                                                                                                                      }): VoiceCommand[] {
                                                                                                                                        return [
                                                                                                                                          {
                                                                                                                                            patterns: ['zimmer buchen', 'book room', 'reservierung', 'reservieren'],
                                                                                                                                                  intent: 'BOOK_ROOM',
                                                                                                                                                  handler: handlers.onBookRoom,
                                                                                                                                                  description: 'Start room booking process',
                                                                                                                                          },
                                                                                                                                          {
                                                                                                                                            patterns: ['verfügbarkeit', 'availability', 'freie zimmer', 'verfügbar'],
                                                                                                                                                  intent: 'CHECK_AVAILABILITY',
                                                                                                                                                  handler: handlers.onCheckAvailability,
                                                                                                                                                  description: 'Check room availability',
                                                                                                                                          },
                                                                                                                                          {
                                                                                                                                            patterns: ['konferenz', 'conference', 'tagung', 'meeting', 'veranstaltung'],
                                                                                                                                                  intent: 'CONFERENCE_INQUIRY',
                                                                                                                                                  handler: handlers.onConferenceInquiry,
                                                                                                                                                  description: 'Conference and meeting inquiry',
                                                                                                                                          },
                                                                                                                                          {
                                                                                                                                            patterns: ['rezeption', 'reception', 'kontakt', 'anrufen', 'hilfe'],
                                                                                                                                                  intent: 'CONTACT_RECEPTION',
                                                                                                                                                  handler: handlers.onContactReception,
                                                                                                                                                  description: 'Contact hotel reception',
                                                                                                                                          },
                                                                                                                                          {
                                                                                                                                            patterns: ['ausstattung', 'amenities', 'service', 'einrichtungen'],
                                                                                                                                                  intent: 'SHOW_AMENITIES',
                                                                                                                                                  handler: handlers.onShowAmenities,
                                                                                                                                                  description: 'Show hotel amenities',
                                                                                                                                          },
                                                                                                                                          {
                                                                                                                                            patterns: ['startseite', 'home', 'hauptseite', 'zur\u00fcck'],
                                                                                                                                                  intent: 'NAVIGATE_HOME',
                                                                                                                                                  handler: handlers.onNavigateHome,
                                                                                                                                                  description: 'Navigate to homepage',
                                                                                                                                          },
                                                                                                                                        ];
                                                                                                                                      }
                                                                                                                                        
                                                                                                                                        /**
                                                                                                                                         * Multi-language response templates for Clara
                                                                                                                                          */
                                                                                                                                        export const CLARA_RESPONSES: Record<SupportedLanguage, Record<string, string>> = {
                                                                                                                                          'de-DE': {
                                                                                                                                                greeting: 'Hallo! Ich bin Clara, Ihre digitale Hotelassistentin. Wie kann ich Ihnen helfen?',
                                                                                                                                                bookRoom: 'Gerne helfe ich Ihnen bei der Zimmerbuchung. Für welches Datum möchten Sie buchen?',
                                                                                                                                                notUnderstood: 'Entschuldigung, das habe ich nicht verstanden. Können Sie das bitte wiederholen?',
                                                                                                                                                goodbye: 'Vielen Dank für Ihren Besuch. Ich wünsche Ihnen einen schönen Tag!',
                                                                                                                                          },
                                                                                                                                          'de-AT': {
                                                                                                                                                greeting: 'Servus! Ich bin Clara, Ihre digitale Hotelassistentin. Wie kann ich Ihnen helfen?',
                                                                                                                                                bookRoom: 'Gerne helfe ich Ihnen bei der Zimmerbuchung. Für welches Datum möchten Sie buchen?',
                                                                                                                                                notUnderstood: 'Entschuldigung, das habe ich nicht verstanden.',
                                                                                                                                                goodbye: 'Vielen Dank für Ihren Besuch!',
                                                                                                                                          },
                                                                                                                                          'de-CH': {
                                                                                                                                                greeting: 'Grüezi! Ich bin Clara, Ihre digitale Hotelassistentin.',
                                                                                                                                                bookRoom: 'Gerne helfe ich Ihnen bei der Zimmerbuchung.',
                                                                                                                                                notUnderstood: 'Entschuldigung, das habe ich nicht verstanden.',
                                                                                                                                                goodbye: 'Vielen Dank für Ihren Besuch!',
                                                                                                                                          },
                                                                                                                                          'en-US': {
                                                                                                                                                greeting: 'Hello! I am Clara, your digital hotel assistant. How can I help you?',
                                                                                                                                                bookRoom: 'I would be happy to help you book a room. For which date?',
                                                                                                                                                notUnderstood: 'Sorry, I did not understand that. Could you please repeat?',
                                                                                                                                                      goodbye: 'Thank you for visiting. Have a wonderful day!',
                                                                                                                                                  },
                                                                                                                                                  };
                                                                                                                                            
