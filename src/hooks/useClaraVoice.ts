/**
 * React Hook for Clara Voice Assistant
 * Provides easy integration of voice features into React components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    ClaraVoiceAssistant,
    VoiceState,
    VoiceConfig,
    VoiceCommand,
    SupportedLanguage,
    CLARA_RESPONSES,
} from '../lib/voiceAssistant';

export interface UseClaraVoiceOptions {
    config?: Partial<VoiceConfig>;
    commands?: VoiceCommand[];
    autoStart?: boolean;
}

export interface UseClaraVoiceReturn {
    state: VoiceState;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string, onEnd?: () => void) => void;
    setLanguage: (lang: SupportedLanguage) => void;
    isSupported: boolean;
    greet: () => void;
}

export function useClaraVoice(
    options: UseClaraVoiceOptions = {}
  ): UseClaraVoiceReturn {
    const assistantRef = useRef<ClaraVoiceAssistant | null>(null);
    const [state, setState] = useState<VoiceState>({
          isListening: false,
          isSpeaking: false,
          transcript: '',
          confidence: 0,
          error: null,
          lastCommand: null,
    });
    const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
        const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
                setIsSupported(false);
                return;
        }

                const assistant = new ClaraVoiceAssistant(options.config);
        assistantRef.current = assistant;

                if (options.commands) {
                        assistant.registerCommands(options.commands);
                }

                const unsubscribe = assistant.subscribe((newState) => {
                        setState(newState);
                });

                if (options.autoStart) {
                        assistant.startListening();
                }

                return () => {
                        unsubscribe();
                        assistant.destroy();
                };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
        assistantRef.current?.startListening();
  }, []);

  const stopListening = useCallback(() => {
        assistantRef.current?.stopListening();
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
        assistantRef.current?.speak(text, onEnd);
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
        assistantRef.current?.setLanguage(lang);
  }, []);

  const greet = useCallback(() => {
        const lang = options.config?.language || 'de-DE';
        const greeting = CLARA_RESPONSES[lang]?.greeting || CLARA_RESPONSES['de-DE'].greeting;
        assistantRef.current?.speak(greeting);
  }, [options.config?.language]);

  return {
        state,
        startListening,
        stopListening,
        speak,
        setLanguage,
        isSupported,
        greet,
  };
}
