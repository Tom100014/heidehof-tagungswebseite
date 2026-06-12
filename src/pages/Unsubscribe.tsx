import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json();
        if (data.valid) setState('valid');
        else if (data.reason === 'already_unsubscribed') setState('already');
        else setState('invalid');
      } catch {
        setState('error');
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
      body: { token },
    });
    setSubmitting(false);
    if (error) setState('error');
    else if (data?.success) setState('success');
    else if (data?.reason === 'already_unsubscribed') setState('already');
    else setState('error');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 border border-border rounded-lg bg-card">
        <h1 className="text-2xl font-serif text-foreground">E-Mail abmelden</h1>
        {state === 'loading' && <p className="text-muted-foreground">Wird geprüft…</p>}
        {state === 'invalid' && <p className="text-muted-foreground">Dieser Link ist ungültig oder abgelaufen.</p>}
        {state === 'already' && <p className="text-muted-foreground">Sie sind bereits abgemeldet.</p>}
        {state === 'error' && <p className="text-destructive">Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.</p>}
        {state === 'valid' && (
          <>
            <p className="text-muted-foreground">
              Möchten Sie sich von zukünftigen E-Mails abmelden?
            </p>
            <Button onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Wird abgemeldet…' : 'Abmeldung bestätigen'}
            </Button>
          </>
        )}
        {state === 'success' && (
          <p className="text-foreground">Sie wurden erfolgreich abgemeldet.</p>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
