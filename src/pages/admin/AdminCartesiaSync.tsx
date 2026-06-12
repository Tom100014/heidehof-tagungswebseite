/**
 * AdminCartesiaSync – Admin-Seite für den Cartesia Voice Agent
 *
 * Funktionen:
 * - Zeigt den Sync-Status (wann wurde der Agent zuletzt aktualisiert)
 * - Manueller "Jetzt synchronisieren" Button
 * - Zeigt Anzahl aktiver Speisen & Getränke im Agent
 * - Erklärt dem Admin wie die automatische Synchronisierung funktioniert
 * - Link zum Cartesia Dashboard
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Phone,
    UtensilsCrossed,
    Wine,
    ExternalLink,
    Info,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Typen ───────────────────────────────────────────────────────────────────

interface SyncStatus {
    last_synced_at: string | null;
    food_count: number;
    drink_count: number;
    agent_id: string;
    status: "success" | "error" | "never";
    error_message?: string;
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

export default function AdminCartesiaSync() {
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Status laden ───────────────────────────────────────────────────────────

  const loadStatus = async () => {
        setIsLoading(true);
        try {
                // Lade Sync-Info aus app_settings
          const { data: settingRow } = await supabase
                  .from("app_settings")
                  .select("value, updated_at")
                  .eq("key", "cartesia_agent_last_sync")
                  .maybeSingle();

          const { count: foodCount } = await supabase
              .from("food_menu")
              .select("*", { count: "exact", head: true })
              .eq("is_active", true);
          const { count: drinkCount } = await supabase
              .from("drinks_menu")
              .select("*", { count: "exact", head: true })
              .eq("is_active", true);

          const val = (settingRow?.value ?? null) as { at?: string; success?: boolean } | null;
          setSyncStatus({
                      last_synced_at: val?.at ?? null,
                      food_count: foodCount ?? 0,
                      drink_count: drinkCount ?? 0,
                      agent_id: "agent_gjYusgM21heczyikufbJ4P",
                      status: val ? (val.success ? "success" : "error") : "never",
          });
        } catch (err) {
                console.error("[AdminCartesiaSync] loadStatus error:", err);
        } finally {
                setIsLoading(false);
        }
  };

  useEffect(() => {
        loadStatus();
  }, []);

  // ── Manueller Sync ─────────────────────────────────────────────────────────

  const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
                const { data, error } = await supabase.functions.invoke("update-cartesia-prompt");

          if (error) throw new Error(error.message);

          setSyncResult({
                    success: data.success,
                    message: data.message ?? (data.success ? "Synchronisierung erfolgreich." : data.error),
          });

          // Status neu laden
          await loadStatus();
        } catch (err) {
                setSyncResult({
                          success: false,
                          message: err instanceof Error ? err.message : String(err),
                });
        } finally {
                setIsSyncing(false);
        }
  };

  // ── Datum formatieren ──────────────────────────────────────────────────────

  const formatDate = (iso: string | null) => {
        if (!iso) return "Noch nie";
        return new Intl.DateTimeFormat("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
        }).format(new Date(iso));
  };

  const getTimeSince = (iso: string | null) => {
        if (!iso) return null;
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 2) return "Gerade eben";
        if (mins < 60) return `vor ${mins} Min.`;
        if (hours < 24) return `vor ${hours} Std.`;
        return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        
          {/* Header */}
              <div className="flex items-start justify-between">
                      <div>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <Phone className="w-6 h-6 text-amber-400" />
                                            Cartesia Voice Agent
                                </h1>
                                <p className="text-zinc-400 text-sm mt-1">
                                            Synchronisiert die Speise- & Getränkekarte mit dem KI-Sprachassistenten
                                </p>
                      </div>
                      <a
                                  href="https://play.cartesia.ai/agents/agent_gjYusgM21heczyikufbJ4P"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                                >
                                Cartesia Dashboard
                                <ExternalLink className="w-3 h-3" />
                      </a>
              </div>
        
          {/* Status Card */}
              <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-3">
                                <CardTitle className="text-base text-white flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-zinc-400" />
                                            Synchronisierungs-Status
                                </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isLoading ? (
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Lade Status...
                      </div>
                    ) : syncStatus ? (
                      <>
                        {/* Status Badge */}
                                    <div className="flex items-center gap-3">
                                      {syncStatus.status === "success" ? (
                                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                        ) : syncStatus.status === "error" ? (
                                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                        ) : (
                                          <Clock className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                                        )}
                                                    <div>
                                                                      <p className="text-sm text-white font-medium">
                                                                        {syncStatus.status === "success"
                                                                                                ? "Agent ist aktuell"
                                                                                                : syncStatus.status === "error"
                                                                                                ? "Letzter Sync fehlgeschlagen"
                                                                                                : "Noch nicht synchronisiert"}
                                                                      </p>
                                                                      <p className="text-xs text-zinc-400">
                                                                                          Zuletzt:{" "}
                                                                                          <span className="text-zinc-300">
                                                                                            {formatDate(syncStatus.last_synced_at)}
                                                                                            </span>
                                                                        {syncStatus.last_synced_at && (
                                              <span className="text-zinc-500 ml-1">
                                                                      ({getTimeSince(syncStatus.last_synced_at)})
                                              </span>
                                                                                          )}
                                                                      </p>
                                                    </div>
                                    </div>
                      
                        {/* Fehlermeldung */}
                        {syncStatus.status === "error" && syncStatus.error_message && (
                                        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                                          <p className="text-xs text-red-400 font-mono">{syncStatus.error_message}</p>
                                        </div>
                                    )}
                      
                                    <Separator className="bg-zinc-700/50" />
                      
                        {/* Zählungen */}
                                    <div className="grid grid-cols-3 gap-4">
                                                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-zinc-800/50">
                                                                      <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                                                                      <span className="text-2xl font-bold text-white tabular-nums">
                                                                        {syncStatus.food_count}
                                                                      </span>
                                                                      <span className="text-xs text-zinc-400">Speisen</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-zinc-800/50">
                                                                      <Wine className="w-5 h-5 text-amber-400" />
                                                                      <span className="text-2xl font-bold text-white tabular-nums">
                                                                        {syncStatus.drink_count}
                                                                      </span>
                                                                      <span className="text-xs text-zinc-400">Getränke</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-zinc-800/50">
                                                                      <Phone className="w-5 h-5 text-green-400" />
                                                                      <span className="text-xs font-medium text-green-400 mt-1">Aktiv</span>
                                                                      <span className="text-xs text-zinc-400">Agent</span>
                                                    </div>
                                    </div>
                      
                        {/* Agent ID */}
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <span>Agent ID:</span>
                                                    <code className="text-zinc-400 font-mono">{syncStatus.agent_id}</code>
                                    </div>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-400">Kein Status verfügbar.</p>
                                )}
                      </CardContent>
              </Card>
        
          {/* Sync Button Card */}
              <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-3">
                                <CardTitle className="text-base text-white flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            Jetzt synchronisieren
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-sm">
                                            Aktualisiert den System Prompt des Cartesia Agents mit der aktuellen
                                            Speise- und Getränkekarte aus dem Admin-System.
                                </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                                <Button
                                              onClick={handleSync}
                                              disabled={isSyncing}
                                              className={cn(
                                                              "w-full sm:w-auto gap-2 font-medium",
                                                              "bg-amber-600 hover:bg-amber-500 text-white",
                                                              "disabled:opacity-50 disabled:cursor-not-allowed"
                                                            )}
                                            >
                                            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                                  {isSyncing ? "Synchronisiere..." : "Speisekarte & Getränke jetzt syncen"}
                                </Button>
                      
                        {/* Sync-Ergebnis */}
                        {syncResult && (
                      <div
                                      className={cn(
                                                        "flex items-start gap-2 px-4 py-3 rounded-xl text-sm",
                                                        syncResult.success
                                                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                                                      )}
                                    >
                        {syncResult.success ? (
                                                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    )}
                                    <span>{syncResult.message}</span>
                      </div>
                                )}
                      </CardContent>
              </Card>
        
          {/* Info Card */}
              <Card className="bg-zinc-900 border-zinc-700">
                      <CardHeader className="pb-3">
                                <CardTitle className="text-base text-white flex items-center gap-2">
                                            <Info className="w-4 h-4 text-blue-400" />
                                            Wie funktioniert die Synchronisierung?
                                </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-zinc-400">
                                <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300 mt-0.5 flex-shrink-0">1</Badge>
                                                          <p>
                                                                          <span className="text-white font-medium">Im Admin Speise/Getränk ändern</span> –
                                                                          in AdminSpeisekarte oder AdminGetraenkekarte ein Gericht bearbeiten und speichern.
                                                          </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300 mt-0.5 flex-shrink-0">2</Badge>
                                                          <p>
                                                                          <span className="text-white font-medium">Hier "Jetzt syncen" klicken</span> –
                                                                          oder den Supabase DB-Webhook so konfigurieren, dass er automatisch bei Änderungen
                                                                          an <code className="text-amber-400">food_menu</code> oder <code className="text-amber-400">drinks</code> auslöst.
                                                          </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300 mt-0.5 flex-shrink-0">3</Badge>
                                                          <p>
                                                                          <span className="text-white font-medium">Clara weiß sofort Bescheid</span> –
                                                                          alle aktuellen Gerichte, Preise, Allergene und Getränke sind beim nächsten
                                                                          Anruf verfügbar.
                                                          </p>
                                            </div>
                                </div>
                      
                                <Separator className="bg-zinc-700/50 my-2" />
                      
                                <div className="flex items-start gap-2 text-xs text-zinc-500">
                                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            <p>
                                                          Für automatische Synchronisierung: In Supabase unter{" "}
                                                          <span className="text-zinc-400">Database → Webhooks</span> einen Webhook auf
                                                          die Tabellen <code className="text-amber-400/70">food_menu</code> und{" "}
                                                          <code className="text-amber-400/70">drinks</code> setzen, der die Function
                                                          <code className="text-amber-400/70"> update-cartesia-prompt</code> aufruft.
                                            </p>
                                </div>
                      </CardContent>
              </Card>
        
        </div>
      );
}
