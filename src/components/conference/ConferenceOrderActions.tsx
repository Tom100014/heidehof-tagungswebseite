import React, { useEffect, useRef, useState } from 'react';
import { Mail, Loader2, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { saveConferenceOrderToSupabase } from '@/features/conference/utils/conference-messaging-utils';
import { supabase } from "@/integrations/supabase/client";
import { computeServiceDay } from '@/utils/serviceDay';
import { isConferenceOrderingOpen } from "@/utils/conferenceOrderTiming";

interface PersonalInfo {
  firstName: string;
  lastName: string;
  company: string;
  conferenceRoom: string;
  email?: string;
}

interface Props {
  personalInfo: PersonalInfo;
  guestType: string;
  lunchSelection: string;
  dinnerSelection?: string;
  menuDate: string;
  menuDateIso?: string;
  onOrderSaved: () => void;
}

const ConferenceOrderActions: React.FC<Props> = ({
  personalInfo, guestType, lunchSelection, dinnerSelection, menuDate, menuDateIso, onOrderSaved,
}) => {
  const [submitting, setSubmitting] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const submit = async () => {
      if (!personalInfo.email) {
        setError("Es wurde keine E-Mail-Adresse erfasst.");
        setSubmitting(false);
        return;
      }
      if (!isConferenceOrderingOpen()) {
        setError('Bestellungen sind zwischen 10:30 und 12:00 Uhr nicht möglich.');
        setSubmitting(false);
        return;
      }

      try {
        const orderDateIso = menuDateIso || computeServiceDay(new Date());
        const stored = localStorage.getItem('conferenceMealSelections');
        const meal = stored ? JSON.parse(stored) : {};
        const fmt = (d: any) => d ? `${d.category}: ${d.name}` : '';

        const orderData = {
          name: `${personalInfo.firstName} ${personalInfo.lastName}`,
          firma: personalInfo.company,
          tagungsraum: personalInfo.conferenceRoom,
          gasttyp: guestType,
          mittagessen: fmt(meal.lunchDetails),
          abendessen: guestType === 'overnight_guest' ? fmt(meal.dinnerDetails) : null,
          versandart: 'email',
          datum: new Date().toISOString(),
          orderDateIso,
          email: personalInfo.email,
        };

        const result = await saveConferenceOrderToSupabase(orderData as any);
        if (!result.success) throw new Error('Bestellung konnte nicht gespeichert werden.');

        try {
          await supabase.functions.invoke('send-conference-confirmation', {
            body: {
              recipientEmail: personalInfo.email,
              firstName: personalInfo.firstName,
              lastName: personalInfo.lastName,
              company: personalInfo.company,
              conferenceRoom: personalInfo.conferenceRoom,
              guestType,
              lunchSelection,
              dinnerSelection,
              menuDate,
              orderId: (result as any).orderId || `${Date.now()}`,
            },
          });
        } catch (e) {
          console.warn('Email confirmation failed:', e);
        }

        setSuccess(true);
        onOrderSaved();
        toast.success('Bestellung erfasst – Bestätigung per E-Mail unterwegs.');
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Fehler beim Speichern der Bestellung.');
        toast.error(e.message || 'Fehler beim Speichern der Bestellung.');
      } finally {
        setSubmitting(false);
      }
    };

    void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (success) {
    return (
      <div className="bg-gradient-to-br from-stone-900 to-black border border-amber-300/30 rounded-3xl p-8 text-center shadow-2xl shadow-amber-300/10">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-300/15 border border-amber-300/40 flex items-center justify-center">
          <Check className="w-7 h-7 text-amber-300" />
        </div>
        <h2 className="font-serif text-2xl text-amber-100 mt-5">Bestellung erfasst</h2>
        <p className="text-amber-100/70 mt-3 text-sm leading-relaxed">
          Eine Bestätigung wurde an <span className="text-amber-200">{personalInfo.email}</span>{' '}
          gesendet. Unsere Küche bereitet alles für Sie vor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-stone-900 to-black border border-amber-300/30 rounded-3xl shadow-2xl shadow-amber-300/10 p-7">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck className="w-5 h-5 text-amber-300" />
        <h2 className="font-serif text-xl text-amber-100">
          {submitting ? 'Bestellung wird übermittelt…' : error ? 'Bestellung fehlgeschlagen' : 'Bestellung erfasst'}
        </h2>
      </div>
      <p className="text-amber-100/60 text-sm mb-5">
        {submitting && 'Ihre Auswahl wird automatisch an die Küche übermittelt. Bitte einen Moment Geduld.'}
        {error && error}
        {!submitting && !error && (
          <>Eine Bestätigung wurde an <span className="text-amber-200">{personalInfo.email || '—'}</span> gesendet.</>
        )}
      </p>

      <div className="rounded-2xl border border-amber-300/15 bg-stone-900/40 p-4 text-xs text-amber-100/55">
        Mit Abschluss dieser Bestellung akzeptieren Sie unsere{' '}
        <a href="/datenschutz" target="_blank" className="underline text-amber-300 hover:text-amber-200">Datenschutzbedingungen</a>.
        Stornierung bis 10:30 Uhr des Bestelltages möglich. Abrechnung über die Tagungspauschale Ihres Unternehmens.
      </div>

      {submitting && (
        <div className="mt-5 flex items-center justify-center gap-2 text-amber-200 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> wird verarbeitet…
        </div>
      )}
      {!submitting && !error && (
        <div className="mt-5 flex items-center justify-center gap-2 text-amber-200 text-sm">
          <Mail className="w-4 h-4" /> E-Mail-Bestätigung versendet
        </div>
      )}
    </div>
  );
};

export default ConferenceOrderActions;
