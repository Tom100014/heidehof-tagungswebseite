// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import ConferenceHeroLayout from "@/components/conference/ConferenceHeroLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ConferenceOrderDetails from '@/components/conference/ConferenceOrderDetails';
import ConferenceOrderActions from '@/components/conference/ConferenceOrderActions';
import ConferenceOrderPdfButton from '@/components/admin/content/conference/ConferenceOrderPdfButton';
import MenuCardPdfButton from '@/components/admin/content/conference/MenuCardPdfButton';
import SaveMenuCardButton from '@/components/admin/content/conference/SaveMenuCardButton';
import ViewDailyMenuButton from '@/components/admin/content/conference/ViewDailyMenuButton';
import { fetchMenuByDate, ConferenceMenu } from "@/services/conference/menu-service";
import { getDailyMenuAssetByDate } from "@/services/conference/daily-menu-assets.service";

// Menu items mapping for display
const menuItems = {
  lunch_fish: {
    name: "Gebratenes Lachsfilet mit Zitronenbutter und Gemüse",
    type: "fish"
  },
  lunch_meat: {
    name: "Rinderfilet mit Rotweinsoße und Kartoffelgratin",
    type: "meat"
  },
  lunch_veg: {
    name: "Gefüllte Paprika mit Quinoa und mediterranem Gemüse",
    type: "vegetarian"
  },
  dinner_fish: {
    name: "Doradenfilet mit Knoblauchöl und Ofengemüse",
    type: "fish"
  },
  dinner_meat: {
    name: "Kalbsschnitzel mit Champignonrahmsauce und Spätzle",
    type: "meat"
  },
  dinner_veg: {
    name: "Gemüse-Risotto mit Parmesan und Rucola",
    type: "vegetarian"
  }
};
const ConferenceOrderSummary = () => {
  const navigate = useNavigate();
  const [guestType, setGuestType] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<any | null>(null);
  const [mealSelections, setMealSelections] = useState<any | null>(null);
  const [menuDate, setMenuDate] = useState<Date | null>(null);
  const [menuData, setMenuData] = useState<ConferenceMenu | null>(null);
  useEffect(() => {
    const storedGuestType = localStorage.getItem('conferenceGuestType');
    const storedPersonalInfo = localStorage.getItem('conferencePersonalInfo');
    const storedMealSelections = localStorage.getItem('conferenceMealSelections');
    if (!storedGuestType || !storedPersonalInfo || !storedMealSelections) {
      navigate('/conference-guests');
      return;
    }
    setGuestType(storedGuestType);
    setPersonalInfo(JSON.parse(storedPersonalInfo));
    const parsedMealSelections = JSON.parse(storedMealSelections);
    setMealSelections(parsedMealSelections);
    if (parsedMealSelections.date) {
      setMenuDate(new Date(parsedMealSelections.date));
    } else {
      setMenuDate(new Date());
    }
  }, [navigate]);
  useEffect(() => {
    const loadMenuForSelectedDate = async () => {
      try {
        if (!menuDate) return;
        const menu = await fetchMenuByDate(format(menuDate, 'yyyy-MM-dd'));
        if (menu) {
          setMenuData(menu);
        }
      } catch (error) {
        console.error('Error loading menu for PDF:', error);
      }
    };
    loadMenuForSelectedDate();
  }, [menuDate]);
  const handleGoBack = () => {
    navigate(-1);
  };
  const getLunchMenuDetails = () => {
    if (!mealSelections) return '';
    // Use new detailed data if available, otherwise fallback to legacy
    if (mealSelections.lunchDetails) {
      return `${mealSelections.lunchDetails.category}: ${mealSelections.lunchDetails.name}`;
    }
    return menuItems[mealSelections.lunch as keyof typeof menuItems]?.name || '';
  };
  const getDinnerMenuDetails = () => {
    if (!mealSelections || !mealSelections.dinner) return '';
    // Use new detailed data if available, otherwise fallback to legacy
    if (mealSelections.dinnerDetails) {
      return `${mealSelections.dinnerDetails.category}: ${mealSelections.dinnerDetails.name}`;
    }
    return menuItems[mealSelections.dinner as keyof typeof menuItems]?.name || '';
  };
  const getLunchSelection = () => {
    if (!mealSelections) return '';
    return mealSelections.lunch || '';
  };
  const getDinnerSelection = () => {
    if (!mealSelections || !mealSelections.dinner) return '';
    return mealSelections.dinner || '';
  };
  const getFormattedDate = () => {
    if (!menuDate) return '';
    return format(menuDate, "dd. MMMM yyyy");
  };
  const handleOrderSaved = () => {
    toast.success('Bestellung erfolgreich versendet!', {
      description: 'Ihre Menübestellung wurde erfolgreich übermittelt.'
    });
  };
  const handleFinish = () => {
    localStorage.removeItem('conferenceGuestType');
    localStorage.removeItem('conferencePersonalInfo');
    localStorage.removeItem('conferenceMealSelections');
    navigate('/welcome');
  };
  if (!personalInfo || !mealSelections) {
    return <div>Daten werden geladen...</div>;
  }
  return (
    <ConferenceHeroLayout
      eyebrow="Schritt 4 · Bestätigung"
      title="Bestellübersicht"
      subtitle="Bitte prüfen Sie Ihre Auswahl und bestätigen Sie die Bestellung. Sie erhalten direkt eine Bestätigung per E-Mail."
    >
      <div className="max-w-4xl mx-auto">

        {/* Intro - Desktop/Tablet */}
        <div className="mb-8 text-center hidden sm:block">
          <p className="text-gray-300 text-lg">
            Bitte prüfen Sie Ihre Auswahl und bestätigen Sie die Bestellung.
          </p>
        </div>
        
        {/* Two Column Layout for Desktop/Tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Order Details */}
            <ConferenceOrderDetails 
              personalInfo={personalInfo} 
              guestType={guestType as string} 
              lunchSelection={getLunchMenuDetails()} 
              dinnerSelection={guestType === 'overnight_guest' ? getDinnerMenuDetails() : undefined} 
              menuDate={getFormattedDate()} 
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Actions */}
            <ConferenceOrderActions
              personalInfo={personalInfo}
              guestType={guestType as string}
              lunchSelection={getLunchMenuDetails()}
              dinnerSelection={guestType === 'overnight_guest' ? getDinnerMenuDetails() : undefined}
              menuDate={getFormattedDate()}
              menuDateIso={menuDate ? format(menuDate, 'yyyy-MM-dd') : undefined}
              onOrderSaved={handleOrderSaved}
            />

            {/* Document Actions Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-apple/30 rounded-2xl shadow-2xl shadow-apple/10 p-6">
              <h3 className="text-lg font-semibold text-apple mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dokumente & Menükarte
              </h3>
              
              <div className="space-y-3">
                <ConferenceOrderPdfButton 
                  personalInfo={{
                    firstName: personalInfo.firstName,
                    lastName: personalInfo.lastName,
                    company: personalInfo.company,
                    conferenceRoom: personalInfo.conferenceRoom,
                    phoneNumber: personalInfo.phoneNumber
                  }} 
                  guestType={guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung'} 
                  lunchSelection={getLunchMenuDetails()} 
                  dinnerSelection={guestType === 'overnight_guest' ? getDinnerMenuDetails() : undefined} 
                  menuDate={getFormattedDate()} 
                />

                {menuData && <>
                  <SaveMenuCardButton 
                    personalInfo={{
                      firstName: personalInfo.firstName,
                      lastName: personalInfo.lastName,
                      company: personalInfo.company,
                      conferenceRoom: personalInfo.conferenceRoom,
                      phoneNumber: personalInfo.phoneNumber
                    }} 
                    guestType={guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung'} 
                    lunchSelection={getLunchSelection()} 
                    dinnerSelection={guestType === 'overnight_guest' ? getDinnerSelection() : undefined} 
                    menuDate={getFormattedDate()} 
                    menuData={menuData} 
                  />

                  <MenuCardPdfButton 
                    personalInfo={{
                      firstName: personalInfo.firstName,
                      lastName: personalInfo.lastName,
                      company: personalInfo.company,
                      conferenceRoom: personalInfo.conferenceRoom,
                      phoneNumber: personalInfo.phoneNumber
                    }} 
                    guestType={guestType === 'day_guest' ? 'Tagungsgast' : 'Tagungsgast + Übernachtung'} 
                    lunchSelection={getLunchSelection()} 
                    dinnerSelection={guestType === 'overnight_guest' ? getDinnerSelection() : undefined} 
                    menuDate={getFormattedDate()} 
                    menuData={menuData} 
                  />

                  <ViewDailyMenuButton menuDate={getFormattedDate()} />
                </>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Finish Button - Full Width Below Everything */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Button 
            className="w-full bg-gradient-to-r from-apple to-yellow-600 hover:from-yellow-600 hover:to-apple text-black font-bold py-4 rounded-xl shadow-lg shadow-apple/30 hover:shadow-2xl hover:shadow-apple/50 transition-all duration-200 text-lg" 
            onClick={handleFinish}
          >
            Fertig
          </Button>
        </div>
      </div>
    </ConferenceHeroLayout>
  );
};
export default ConferenceOrderSummary;