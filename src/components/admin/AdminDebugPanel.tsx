
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminSecurity } from '@/utils/admin-security';
import { toast } from 'sonner';
import { Shield, User, Database, RefreshCcw } from 'lucide-react';

export const AdminDebugPanel = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAdminStatus = async () => {
    setIsLoading(true);
    try {
      const adminStatus = await adminSecurity.isAdmin();
      const superAdminStatus = await adminSecurity.isSuperAdmin();
      
      setIsAdmin(adminStatus);
      setIsSuperAdmin(superAdminStatus);
      
      toast.success('Admin-Status geprüft', {
        description: `Admin: ${adminStatus ? 'Ja' : 'Nein'}, Super-Admin: ${superAdminStatus ? 'Ja' : 'Nein'}`
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Fehler beim Prüfen des Admin-Status');
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminAccess = async () => {
    setIsLoading(true);
    try {
      const success = await adminSecurity.createTemporaryAdmin();
      if (success) {
        toast.success('Admin-Zugriff erstellt!', {
          description: 'Seite wird in 2 Sekunden neu geladen...'
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error('Fehler beim Erstellen des Admin-Zugriffs');
      }
    } catch (error) {
      console.error('Error creating admin access:', error);
      toast.error('Fehler beim Erstellen des Admin-Zugriffs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Admin-Status:</span>
          <Badge variant={isAdmin === true ? 'default' : isAdmin === false ? 'destructive' : 'secondary'}>
            {isAdmin === null ? 'Unbekannt' : isAdmin ? 'Admin' : 'Kein Admin'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Super-Admin:</span>
          <Badge variant={isSuperAdmin === true ? 'default' : isSuperAdmin === false ? 'destructive' : 'secondary'}>
            {isSuperAdmin === null ? 'Unbekannt' : isSuperAdmin ? 'Super-Admin' : 'Kein Super-Admin'}
          </Badge>
        </div>
        
        <div className="space-y-2 pt-4">
          <Button 
            onClick={checkAdminStatus} 
            disabled={isLoading}
            variant="outline" 
            className="w-full"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Status prüfen
          </Button>
          
          <Button 
            onClick={createAdminAccess} 
            disabled={isLoading}
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            Admin-Zugriff erstellen
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2">
          <Database className="h-4 w-4 inline mr-1" />
          Für Entwicklung und Fehlerbehebung
        </div>
      </CardContent>
    </Card>
  );
};
