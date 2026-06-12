// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import ConferenceHeroLayout from "@/components/conference/ConferenceHeroLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2, Clock, Info, Fish, Beef, Leaf } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchMenuByDate, ConferenceMenu } from "@/services/conference/menu-service";
import { fetchActiveImagesByType } from "@/services/conference/menu-image-service";
import { getDisplayMenuDate, formatDateIso } from "@/utils/conferenceOrderTiming";
import { OrderDeadlineCountdown } from "@/components/conference/OrderDeadlineCountdown";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  type: 'fish' | 'meat' | 'vegetarian';
}

interface MenuData {
  appetizer: string;
  mainDishes: MenuItem[];
  dessert: string;
}

const ConferenceMenuSelection = () => {
  const navigate = useNavigate();
  const [guestType, setGuestType] = useState<string | null>(null);
  const [personalInfo, setPersonalInfo] = useState<any | null>(null);
  const [lunchSelection, setLunchSelection] = useState<string>("");
  const [dinnerSelection, setDinnerSelection] = useState<string>("");
  const [menuData, setMenuData] = useState<ConferenceMenu | null>(null);
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const displayDate = getDisplayMenuDate();

  useEffect(() => {
    const storedGuestType = localStorage.getItem('conferenceGuestType');
    const storedPersonalInfo = localStorage.getItem('conferencePersonalInfo');
    
    console.log('Loading stored data:', { storedGuestType, storedPersonalInfo });
    
    if (!storedGuestType || !storedPersonalInfo) {
      console.log('Missing data, redirecting to conference-guests');
      navigate('/conference-guests');
      return;
    }
    
    setGuestType(storedGuestType);
    setPersonalInfo(JSON.parse(storedPersonalInfo));
  }, [navigate]);

  useEffect(() => {
    const loadMenuForDisplayDate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const menu = await fetchMenuByDate(formatDateIso(displayDate));
        if (menu) {
          setMenuData(menu);
          
          try {
            const images = await fetchActiveImagesByType(menu.id!);
            setMenuImages(images);
            console.log('Loaded menu images:', images);
          } catch (imageError) {
            console.warn('Failed to load menu images:', imageError);
          }
        } else {
          setError("Für das ausgewählte Datum ist kein Menü verfügbar. Bitte kontaktieren Sie das Hotel.");
        }
      } catch (err) {
        console.error("Error loading menu:", err);
        setError("Fehler beim Laden des Menüs. Bitte versuchen Sie es später erneut.");
      } finally {
        setLoading(false);
      }
    };

    loadMenuForDisplayDate();
  }, []);

  // Zeitlogik für Bestellungen
  const getOrderStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // OFFEN: 00:00-10:30 (für heute) oder 12:00-23:59 (für morgen)
    const isOpenForToday = currentHour < 10 || (currentHour === 10 && currentMinute < 30);
    const isOpenForTomorrow = currentHour >= 12;
    const isPaused = currentHour >= 10 && (currentHour < 12 || (currentHour === 10 && currentMinute >= 30));
    
    if (isOpenForToday) {
      return {
        isOpen: true,
        message: "Bestellungen für HEUTE bis 10:30 Uhr möglich",
        status: "today",
        color: "text-zinc-600"
      };
    } else if (isOpenForTomorrow) {
      return {
        isOpen: true,
        message: "Bestellungen für MORGEN bis 10:30 Uhr möglich",
        status: "tomorrow", 
        color: "text-blue-600"
      };
    } else {
      return {
        isOpen: false,
        message: "Pause: Nächste Bestellmöglichkeit um 12:00 Uhr für morgen",
        status: "closed",
        color: "text-red-600"
      };
    }
  };

  const handleContinue = () => {
    console.log('handleContinue called - simple version');
    console.log('Current selections:', { lunchSelection, dinnerSelection, guestType });
    
    // Validierung
    if (!lunchSelection) {
      console.log('No lunch selection');
      toast.error('Bitte wählen Sie ein Mittagsmenü aus');
      return;
    }
    
    if (guestType === 'overnight_guest' && !dinnerSelection) {
      console.log('Overnight guest but no dinner selection');
      toast.error('Bitte wählen Sie ein Abendmenü aus');
      return;
    }

    setIsNavigating(true);

    // Menüauswahl speichern mit Kategorien
    const getLunchDishDetails = () => {
      const lunchMenu = getLunchMenu();
      if (!lunchMenu) return null;
      const selectedDish = lunchMenu.mainDishes.find(dish => dish.id === lunchSelection);
      return selectedDish ? {
        id: selectedDish.id,
        name: selectedDish.name,
        description: selectedDish.description,
        category: selectedDish.type === 'fish' ? 'Fisch' : 
                 selectedDish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'
      } : null;
    };

    const getDinnerDishDetails = () => {
      const dinnerMenu = getDinnerMenu();
      if (!dinnerMenu || !dinnerSelection) return null;
      const selectedDish = dinnerMenu.mainDishes.find(dish => dish.id === dinnerSelection);
      return selectedDish ? {
        id: selectedDish.id,
        name: selectedDish.name,
        description: selectedDish.description,
        category: selectedDish.type === 'fish' ? 'Fisch' : 
                 selectedDish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'
      } : null;
    };

    const mealSelections = {
      lunch: lunchSelection,
      lunchDetails: getLunchDishDetails(),
      dinner: guestType === 'overnight_guest' ? dinnerSelection : null,
      dinnerDetails: guestType === 'overnight_guest' ? getDinnerDishDetails() : null,
      date: displayDate.toISOString()
    };
    
    console.log('Saving meal selections:', mealSelections);
    localStorage.setItem('conferenceMealSelections', JSON.stringify(mealSelections));
    
    console.log('Navigating to order summary...');
    
    // Direkte Navigation ohne setTimeout
    navigate('/conference-guests/order-summary');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const isNextEnabled = () => {
    if (!lunchSelection) return false;
    if (guestType === 'overnight_guest' && !dinnerSelection) return false;
    return true;
  };

  const handleDishSelection = (mealType: 'lunch' | 'dinner', dishId: string) => {
    console.log('Dish selected:', { mealType, dishId });
    if (mealType === 'lunch') {
      setLunchSelection(dishId);
    } else {
      setDinnerSelection(dishId);
    }
  };

  const getLunchMenu = (): MenuData | null => {
    if (!menuData) return null;
    return {
      appetizer: menuData.lunch_appetizer,
      mainDishes: [
        {
          id: "lunch_fish",
          name: menuData.lunch_main_dish_fish.name,
          description: menuData.lunch_main_dish_fish.description,
          type: "fish"
        },
        {
          id: "lunch_meat",
          name: menuData.lunch_main_dish_meat.name,
          description: menuData.lunch_main_dish_meat.description,
          type: "meat"
        },
        {
          id: "lunch_veg",
          name: menuData.lunch_main_dish_vegetarian.name,
          description: menuData.lunch_main_dish_vegetarian.description,
          type: "vegetarian"
        }
      ],
      dessert: menuData.lunch_dessert
    };
  };

  const getDinnerMenu = (): MenuData | null => {
    if (!menuData) return null;
    return {
      appetizer: menuData.dinner_appetizer,
      mainDishes: [
        {
          id: "dinner_fish",
          name: menuData.dinner_main_dish_fish.name,
          description: menuData.dinner_main_dish_fish.description,
          type: "fish"
        },
        {
          id: "dinner_meat",
          name: menuData.dinner_main_dish_meat.name,
          description: menuData.dinner_main_dish_meat.description,
          type: "meat"
        },
        {
          id: "dinner_veg",
          name: menuData.dinner_main_dish_vegetarian.name,
          description: menuData.dinner_main_dish_vegetarian.description,
          type: "vegetarian"
        }
      ],
      dessert: menuData.dinner_dessert
    };
  };

  // Funktion um das richtige Bild für einen Dish-Typ zu finden
  const getDishImage = (mealType: 'lunch' | 'dinner', dishType: 'fish' | 'meat' | 'vegetarian') => {
    const imageKey = `${mealType}_${dishType}`;
    return menuImages[imageKey] || null;
  };

  const formattedDate = format(displayDate, "dd. MMMM yyyy");
  const lunchMenu = getLunchMenu();
  const dinnerMenu = getDinnerMenu();

  return (
    <ConferenceHeroLayout
      eyebrow="Schritt 3 · Menüauswahl"
      title={guestType === 'overnight_guest' ? 'Ihre Mahlzeiten' : 'Ihr Mittagsmenü'}
      subtitle={`Menü für ${formattedDate} · Bitte wählen Sie aus den heutigen Kreationen unserer Küche.`}
    >
      <div className="max-w-3xl mx-auto pb-32">

        {/* Countdown Timer */}
        <OrderDeadlineCountdown className="mb-4 animate-fade-in" />

        {/* Zeitstatus Anzeige */}
        <div className="mb-6 p-4 rounded-lg border border-apple/30 bg-apple/10 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-apple" />
              <span className="font-semibold text-apple">Bestellstatus</span>
            </div>
            <div className={`flex items-center space-x-2 ${getOrderStatus().color}`}>
              <div className={`w-2 h-2 rounded-full ${
                getOrderStatus().isOpen ? 'bg-zinc-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {getOrderStatus().isOpen ? 'OFFEN' : 'GESCHLOSSEN'}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {getOrderStatus().message}
          </p>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Bestellschluss: täglich 10:30 Uhr</p>
            <p>• Nach 10:30 Uhr → Bestellungen für nächsten Tag ab 12:00 Uhr</p>
            <p>• Menüverfügbarkeit: ab 12:00 Uhr</p>
          </div>
          
          {!getOrderStatus().isOpen && (
            <div className="mt-3 p-2 rounded bg-red-100 border border-red-300">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  Bestellungen derzeit nicht möglich
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Bestellungen können zwischen 10:30 - 12:00 Uhr nicht aufgegeben werden.
              </p>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-apple" />
            <span className="ml-2 text-muted-foreground">Lade Menü...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-apple text-apple hover:bg-apple hover:text-background"
            >
              Erneut versuchen
            </Button>
          </div>
        )}

        {!loading && !error && lunchMenu && (
          <>
            {/* Lunch Menu Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-medium text-apple mb-4">Mittagsmenü</h2>
              
              <div className="mb-4 p-4 rounded-md backdrop-blur-sm bg-apple/20">
                <h3 className="font-medium">Vorspeise</h3>
                <p className="text-sm text-muted-foreground">{lunchMenu.appetizer}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Hauptgericht</h3>
                <div className="space-y-3">
                  {lunchMenu.mainDishes.map((dish, index) => {
                    const dishImage = getDishImage('lunch', dish.type);
                    const isSelected = lunchSelection === dish.id;
                    const DishIcon = dish.type === 'fish' ? Fish : dish.type === 'meat' ? Beef : Leaf;
                    const colorClass = dish.type === 'fish' ? 'text-blue-400' : dish.type === 'meat' ? 'text-red-400' : 'text-zinc-400';
                    const bgColorClass = dish.type === 'fish' ? 'bg-blue-500/20' : dish.type === 'meat' ? 'bg-red-500/20' : 'bg-zinc-500/20';
                    
                    return (
                      <div
                        key={dish.id}
                        className={cn(
                          "cursor-pointer rounded-lg border transition-all duration-300 backdrop-blur-sm overflow-hidden",
                          "hover-scale animate-fade-in",
                          isSelected
                            ? "border-apple bg-apple/30 text-white shadow-lg shadow-apple/20 scale-105"
                            : "border-apple/20 hover:border-apple/40 hover:bg-apple/15"
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => handleDishSelection('lunch', dish.id)}
                      >
                        {/* Bild falls vorhanden */}
                        {dishImage && (
                          <div className="aspect-video w-full overflow-hidden relative">
                            <img 
                              src={dishImage} 
                              alt={dish.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                            {/* Category Badge on Image */}
                            <div className={cn(
                              "absolute top-2 right-2 px-2 py-1 rounded-full backdrop-blur-md border",
                              bgColorClass,
                              "border-white/20"
                            )}>
                              <div className="flex items-center gap-1">
                                <DishIcon className={cn("w-3 h-3", colorClass)} />
                                <span className="text-xs font-semibold text-white">
                                  {dish.type === 'fish' ? 'Fisch' : dish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {!dishImage && (
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                  bgColorClass
                                )}>
                                  <DishIcon className={cn("w-5 h-5", colorClass)} />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                {!dishImage && (
                                  <div className={cn(
                                    "text-xs uppercase tracking-wide mb-1 font-semibold",
                                    colorClass
                                  )}>
                                    {dish.type === 'fish' ? 'Fisch' : dish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'}
                                  </div>
                                )}
                                <div className="font-medium text-base">{dish.name}</div>
                                <div className="text-sm text-muted-foreground mt-1">{dish.description}</div>
                              </div>
                            </div>
                            
                            <div className={cn(
                              "transition-all duration-300 ml-2",
                              isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}>
                              <div className="bg-apple rounded-full p-1">
                                <Check className="h-4 w-4 text-background" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 rounded-md backdrop-blur-sm bg-apple/20">
                <h3 className="font-medium">Nachspeise</h3>
                <p className="text-sm text-muted-foreground">{lunchMenu.dessert}</p>
              </div>
            </div>
            
            {/* Dinner Menu Selection - Only for overnight guests */}
            {guestType === 'overnight_guest' && dinnerMenu && (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-apple mb-4">Abendmenü</h2>
                
                <div className="mb-4 p-4 bg-apple/20 rounded-md backdrop-blur-sm">
                  <h3 className="font-medium">Vorspeise</h3>
                  <p className="text-sm text-muted-foreground">{dinnerMenu.appetizer}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Hauptgericht</h3>
                  <div className="space-y-3">
                    {dinnerMenu.mainDishes.map((dish, index) => {
                      const dishImage = getDishImage('dinner', dish.type);
                      const isSelected = dinnerSelection === dish.id;
                      const DishIcon = dish.type === 'fish' ? Fish : dish.type === 'meat' ? Beef : Leaf;
                      const colorClass = dish.type === 'fish' ? 'text-blue-400' : dish.type === 'meat' ? 'text-red-400' : 'text-zinc-400';
                      const bgColorClass = dish.type === 'fish' ? 'bg-blue-500/20' : dish.type === 'meat' ? 'bg-red-500/20' : 'bg-zinc-500/20';
                      
                      return (
                        <div
                          key={dish.id}
                          className={cn(
                            "cursor-pointer rounded-lg border transition-all duration-300 backdrop-blur-sm overflow-hidden",
                            "hover-scale animate-fade-in",
                            isSelected
                              ? "border-apple bg-apple/30 text-white shadow-lg shadow-apple/20 scale-105"
                              : "border-apple/20 hover:border-apple/40 hover:bg-apple/15"
                          )}
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => handleDishSelection('dinner', dish.id)}
                        >
                          {/* Bild falls vorhanden */}
                          {dishImage && (
                            <div className="aspect-video w-full overflow-hidden relative">
                              <img 
                                src={dishImage} 
                                alt={dish.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                              {/* Category Badge on Image */}
                              <div className={cn(
                                "absolute top-2 right-2 px-2 py-1 rounded-full backdrop-blur-md border",
                                bgColorClass,
                                "border-white/20"
                              )}>
                                <div className="flex items-center gap-1">
                                  <DishIcon className={cn("w-3 h-3", colorClass)} />
                                  <span className="text-xs font-semibold text-white">
                                    {dish.type === 'fish' ? 'Fisch' : dish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3 flex-1">
                                {!dishImage && (
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                    bgColorClass
                                  )}>
                                    <DishIcon className={cn("w-5 h-5", colorClass)} />
                                  </div>
                                )}
                                
                                <div className="flex-1">
                                  {!dishImage && (
                                    <div className={cn(
                                      "text-xs uppercase tracking-wide mb-1 font-semibold",
                                      colorClass
                                    )}>
                                      {dish.type === 'fish' ? 'Fisch' : dish.type === 'meat' ? 'Fleisch' : 'Vegetarisch'}
                                    </div>
                                  )}
                                  <div className="font-medium text-base">{dish.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">{dish.description}</div>
                                </div>
                              </div>
                              
                              <div className={cn(
                                "transition-all duration-300 ml-2",
                                isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0"
                              )}>
                                <div className="bg-apple rounded-full p-1">
                                  <Check className="h-4 w-4 text-background" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 bg-apple/20 rounded-md backdrop-blur-sm">
                  <h3 className="font-medium">Nachspeise</h3>
                  <p className="text-sm text-muted-foreground">{dinnerMenu.dessert}</p>
                </div>
              </div>
            )}
            
            <Button 
              className={cn(
                "w-full mt-6 text-background transition-all duration-300 relative",
                isNextEnabled() && !isNavigating
                  ? "bg-apple hover:bg-apple-dark" 
                  : "bg-gray-400 cursor-not-allowed"
              )}
              onClick={handleContinue}
              disabled={!isNextEnabled() || isNavigating || !getOrderStatus().isOpen}
            >
              {isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  Weiter <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </ConferenceHeroLayout>
  );
};

export default ConferenceMenuSelection;
