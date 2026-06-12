import React from 'react';

export type Language = 'de' | 'en' | 'fr' | 'es' | 'it' | 'zh' | 'ja' | 'ar' | 'ru';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

// Basic translations for key UI elements
const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.services': 'Services',
    'nav.contact': 'Kontakt',
    'nav.admin': 'Admin',
    
    // Dashboard
    'dashboard.title': 'Hotel Zentrale',
    'dashboard.subtitle': 'Übersicht aller Anfragen und Bestellungen',
    'dashboard.newOrders': 'Neue Bestellungen',
    'dashboard.newAppointments': 'Neue Termine',
    'dashboard.newMessages': 'Neue Nachrichten',
    'dashboard.reservations': 'Reservierungen',
    'dashboard.complaints': 'Beschwerden',
    'dashboard.notifications': 'Benachrichtigungen',
    'dashboard.quickAccess': 'Schnellzugriff',
    'dashboard.refresh': 'Aktualisieren',
    
    // Common actions
    'action.view': 'Ansehen',
    'action.edit': 'Bearbeiten',
    'action.delete': 'Löschen',
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'action.submit': 'Senden',
    'action.back': 'Zurück',
    'action.next': 'Weiter',
    
    // Status
    'status.new': 'Neu',
    'status.pending': 'Ausstehend',
    'status.confirmed': 'Bestätigt',
    'status.completed': 'Abgeschlossen',
    'status.cancelled': 'Storniert',
    
    // Forms
    'form.name': 'Name',
    'form.email': 'E-Mail',
    'form.phone': 'Telefon',
    'form.message': 'Nachricht',
    'form.required': 'Pflichtfeld',
    
    // Time
    'time.morning': 'Morgen',
    'time.afternoon': 'Nachmittag',
    'time.evening': 'Abend',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin',
    
    // Dashboard
    'dashboard.title': 'Hotel Control Center',
    'dashboard.subtitle': 'Overview of all requests and orders',
    'dashboard.newOrders': 'New Orders',
    'dashboard.newAppointments': 'New Appointments',
    'dashboard.newMessages': 'New Messages',
    'dashboard.reservations': 'Reservations',
    'dashboard.complaints': 'Complaints',
    'dashboard.notifications': 'Notifications',
    'dashboard.quickAccess': 'Quick Access',
    'dashboard.refresh': 'Refresh',
    
    // Common actions
    'action.view': 'View',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.submit': 'Submit',
    'action.back': 'Back',
    'action.next': 'Next',
    
    // Status
    'status.new': 'New',
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    
    // Forms
    'form.name': 'Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.message': 'Message',
    'form.required': 'Required',
    
    // Time
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'nav.admin': 'Admin',
    'dashboard.title': 'Centre de Contrôle Hôtel',
    'dashboard.subtitle': 'Aperçu de toutes les demandes et commandes',
    'dashboard.newOrders': 'Nouvelles Commandes',
    'dashboard.newAppointments': 'Nouveaux Rendez-vous',
    'dashboard.newMessages': 'Nouveaux Messages',
    'dashboard.reservations': 'Réservations',
    'dashboard.complaints': 'Plaintes',
    'dashboard.notifications': 'Notifications',
    'dashboard.quickAccess': 'Accès Rapide',
    'dashboard.refresh': 'Actualiser',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.services': 'Servicios',
    'nav.contact': 'Contacto',
    'nav.admin': 'Admin',
    'dashboard.title': 'Centro de Control del Hotel',
    'dashboard.subtitle': 'Resumen de todas las solicitudes y pedidos',
    'dashboard.newOrders': 'Nuevos Pedidos',
    'dashboard.newAppointments': 'Nuevas Citas',
    'dashboard.newMessages': 'Nuevos Mensajes',
    'dashboard.reservations': 'Reservas',
    'dashboard.complaints': 'Quejas',
    'dashboard.notifications': 'Notificaciones',
    'dashboard.quickAccess': 'Acceso Rápido',
    'dashboard.refresh': 'Actualizar',
  },
  it: {
    'nav.home': 'Home',
    'nav.services': 'Servizi',
    'nav.contact': 'Contatto',
    'nav.admin': 'Admin',
    'dashboard.title': 'Centro di Controllo Hotel',
    'dashboard.subtitle': 'Panoramica di tutte le richieste e gli ordini',
    'dashboard.newOrders': 'Nuovi Ordini',
    'dashboard.newAppointments': 'Nuovi Appuntamenti',
    'dashboard.newMessages': 'Nuovi Messaggi',
    'dashboard.reservations': 'Prenotazioni',
    'dashboard.complaints': 'Reclami',
    'dashboard.notifications': 'Notifiche',
    'dashboard.quickAccess': 'Accesso Rapido',
    'dashboard.refresh': 'Aggiorna',
  },
  zh: {
    'nav.home': '首页',
    'nav.services': '服务',
    'nav.contact': '联系',
    'nav.admin': '管理',
    'dashboard.title': '酒店控制中心',
    'dashboard.subtitle': '所有请求和订单的概览',
    'dashboard.newOrders': '新订单',
    'dashboard.newAppointments': '新预约',
    'dashboard.newMessages': '新消息',
    'dashboard.reservations': '预订',
    'dashboard.complaints': '投诉',
    'dashboard.notifications': '通知',
    'dashboard.quickAccess': '快速访问',
    'dashboard.refresh': '刷新',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.services': 'サービス',
    'nav.contact': 'お問い合わせ',
    'nav.admin': '管理',
    'dashboard.title': 'ホテル管理センター',
    'dashboard.subtitle': 'すべてのリクエストと注文の概要',
    'dashboard.newOrders': '新しい注文',
    'dashboard.newAppointments': '新しい予約',
    'dashboard.newMessages': '新しいメッセージ',
    'dashboard.reservations': '予約',
    'dashboard.complaints': '苦情',
    'dashboard.notifications': '通知',
    'dashboard.quickAccess': 'クイックアクセス',
    'dashboard.refresh': '更新',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.services': 'الخدمات',
    'nav.contact': 'الاتصال',
    'nav.admin': 'المدير',
    'dashboard.title': 'مركز التحكم في الفندق',
    'dashboard.subtitle': 'نظرة عامة على جميع الطلبات والأوامر',
    'dashboard.newOrders': 'الطلبات الجديدة',
    'dashboard.newAppointments': 'المواعيد الجديدة',
    'dashboard.newMessages': 'الرسائل الجديدة',
    'dashboard.reservations': 'الحجوزات',
    'dashboard.complaints': 'الشكاوى',
    'dashboard.notifications': 'التنبيهات',
    'dashboard.quickAccess': 'الوصول السريع',
    'dashboard.refresh': 'تحديث',
  },
  ru: {
    'nav.home': 'Главная',
    'nav.services': 'Услуги',
    'nav.contact': 'Контакты',
    'nav.admin': 'Админ',
    'dashboard.title': 'Центр управления отелем',
    'dashboard.subtitle': 'Обзор всех запросов и заказов',
    'dashboard.newOrders': 'Новые заказы',
    'dashboard.newAppointments': 'Новые встречи',
    'dashboard.newMessages': 'Новые сообщения',
    'dashboard.reservations': 'Бронирования',
    'dashboard.complaints': 'Жалобы',
    'dashboard.notifications': 'Уведомления',
    'dashboard.quickAccess': 'Быстрый доступ',
    'dashboard.refresh': 'Обновить',
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>('de');

  // Initialize language from localStorage after component mounts
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('hotel-language');
        if (saved && ['de', 'en', 'fr', 'es', 'it', 'zh', 'ja', 'ar', 'ru'].includes(saved)) {
          setCurrentLanguage(saved as Language);
        }
      }
    } catch (error) {
      console.warn('Failed to load language from localStorage:', error);
    }
  }, []);

  // Save language to localStorage when it changes
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('hotel-language', currentLanguage);
      }
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    try {
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    try {
      let translation = translations[currentLanguage]?.[key] || translations.de[key] || key;
      
      // Simple parameter replacement
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          translation = translation.replace(`{{${param}}}`, value);
        });
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};