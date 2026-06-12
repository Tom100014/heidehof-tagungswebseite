
import React, { useEffect, useState } from 'react';
import { Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface Language {
  id: string;
  name: string;
  flag: string;
  native: string;
}

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages: Language[] = [
  { id: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { id: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { id: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { id: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { id: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { id: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' }
];

const LanguageSelector = ({ currentLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  useEffect(() => {
    const language = languages.find(lang => lang.id === currentLanguage);
    if (language) {
      setSelectedLanguage(language);
    }
  }, [currentLanguage]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Flag className="h-5 w-5" />
        <h2 className="text-lg font-medium">Sprache ändern</h2>
      </div>
      
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Sprache suchen..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          <CommandGroup>
            {languages.map(language => (
              <CommandItem
                key={language.id}
                onSelect={() => {
                  onLanguageChange(language.id);
                  setOpen(false);
                }}
                className="flex items-center justify-between cursor-pointer p-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{language.flag}</span>
                  <span>{language.native}</span>
                  <span className="text-xs text-muted-foreground">({language.name})</span>
                </div>
                {language.id === currentLanguage && (
                  <Check className="h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      
      <div className="pt-4">
        <p className="text-sm text-muted-foreground">
          Die aktuelle Sprache ist {selectedLanguage?.native} ({selectedLanguage?.name}).
        </p>
      </div>
    </div>
  );
};

export default LanguageSelector;
