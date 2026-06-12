// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';

export interface Recipe {
  id: string;
  menu_id: string;
  dish_type: string;
  portions: number;
  preparation_time_minutes: number;
  cooking_time_minutes: number;
  difficulty_level: string;
  recipe_content: {
    ingredients?: Array<{
      name: string;
      quantity: string;
      unit: string;
    }>;
    instructions?: string[];
    chef_tips?: string[];
    presentation?: string;
    presentation_image?: string;
    image_url?: string;
  };
  chef_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  menu_id: string;
  guest_count: number;
  shopping_items: {
    categories: Array<{
      name: string;
      items: Array<{
        name: string;
        quantity: string;
        unit: string;
        estimated_cost?: string;
      }>;
    }>;
  };
  total_estimated_cost?: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCalculation {
  id: string;
  menu_id: string;
  guest_count: number;
  cost_breakdown: {
    calculation_breakdown?: {
      lunch?: {
        appetizer?: {
          dish_name: string;
          portions: number;
          food_cost_per_portion: number;
          labor_cost_per_portion: number;
          overhead_cost_per_portion: number;
          total_cost_per_portion: number;
          suggested_price_per_portion: number;
          profit_margin_percent: number;
          total_food_cost: number;
          total_cost: number;
          total_revenue: number;
        };
        main_dishes?: {
          fish?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
          meat?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
          vegetarian?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
        };
        dessert?: {
          dish_name: string;
          portions: number;
          food_cost_per_portion: number;
          labor_cost_per_portion: number;
          overhead_cost_per_portion: number;
          total_cost_per_portion: number;
          suggested_price_per_portion: number;
          profit_margin_percent: number;
          total_food_cost: number;
          total_cost: number;
          total_revenue: number;
        };
        lunch_totals?: {
          total_food_cost: number;
          total_labor_cost: number;
          total_overhead_cost: number;
          total_cost: number;
          total_revenue: number;
          total_profit: number;
          overall_margin_percent: number;
        };
      };
      dinner?: {
        appetizer?: {
          dish_name: string;
          portions: number;
          food_cost_per_portion: number;
          labor_cost_per_portion: number;
          overhead_cost_per_portion: number;
          total_cost_per_portion: number;
          suggested_price_per_portion: number;
          profit_margin_percent: number;
          total_food_cost: number;
          total_cost: number;
          total_revenue: number;
        };
        main_dishes?: {
          fish?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
          meat?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
          vegetarian?: {
            dish_name: string;
            description?: string;
            portions: number;
            food_cost_per_portion: number;
            labor_cost_per_portion: number;
            overhead_cost_per_portion: number;
            total_cost_per_portion: number;
            suggested_price_per_portion: number;
            profit_margin_percent: number;
            total_food_cost: number;
            total_cost: number;
            total_revenue: number;
          };
        };
        dessert?: {
          dish_name: string;
          portions: number;
          food_cost_per_portion: number;
          labor_cost_per_portion: number;
          overhead_cost_per_portion: number;
          total_cost_per_portion: number;
          suggested_price_per_portion: number;
          profit_margin_percent: number;
          total_food_cost: number;
          total_cost: number;
          total_revenue: number;
        };
        dinner_totals?: {
          total_food_cost: number;
          total_labor_cost: number;
          total_overhead_cost: number;
          total_cost: number;
          total_revenue: number;
          total_profit: number;
          overall_margin_percent: number;
        };
      };
      grand_totals?: {
        total_food_cost: number;
        total_labor_cost: number;
        total_overhead_cost: number;
        total_cost: number;
        total_revenue: number;
        total_profit: number;
        overall_margin_percent: number;
      };
    };
    categories?: Array<{
      name: string;
      items: Array<{
        name: string;
        quantity: string;
        unit_cost: string;
        total_cost: string;
      }>;
      total: string;
    }>;
    food_costs?: {
      lunch?: {
        appetizer: number;
        main_dishes: number;
        dessert: number;
      };
      dinner?: {
        appetizer: number;
        main_dishes: number;
        dessert: number;
      };
    };
  };
  total_food_cost: number;
  labor_cost?: number;
  overhead_cost?: number;
  total_cost: number;
  profit_margin?: number;
  suggested_price?: number;
  created_at: string;
  updated_at: string;
}

export interface KitchenPlan {
  id: string;
  menu_id: string;
  guest_count: number;
  preparation_schedule: Array<{
    time: string;
    task: string;
    dish: string;
    duration_minutes: number;
    station: string;
    staff_needed: string;
  }>;
  mise_en_place?: Array<{
    category: string;
    deadline: string;
    tasks: string[];
  }>;
  equipment_needed?: {
    items: string[];
  };
  staff_requirements?: {
    total_staff: number;
    positions: Array<{
      role: string;
      count: number;
      tasks: string[];
    }>;
  };
  service_timeline?: Array<{
    time: string;
    event: string;
    tasks: string[];
    notes?: string;
  }>;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

// Updated interface to support the new guest distribution format
export interface GuestDistribution {
  dayGuests: number;
  overnightGuests: number;
  vegetarian: number;
  meat: number;
  fish: number;
}

export async function fetchRecipesByMenuId(menuId: string): Promise<Recipe[]> {
  console.log('Fetching recipes for menu ID:', menuId);
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('menu_id', menuId)
      .order('dish_type');

    if (error) {
      console.error('Error fetching recipes:', error);
      throw error;
    }

    console.log('Fetched recipes:', data);
    return (data || []).map(recipe => ({
      ...recipe,
      recipe_content: typeof recipe.recipe_content === 'object' ? 
        recipe.recipe_content as Recipe['recipe_content'] : 
        JSON.parse(recipe.recipe_content as string)
    }));
  } catch (error) {
    console.error('Error in fetchRecipesByMenuId:', error);
    throw error;
  }
}

export async function fetchShoppingListByMenuId(menuId: string): Promise<ShoppingList[]> {
  console.log('Fetching shopping list for menu ID:', menuId);
  
  try {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('menu_id', menuId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shopping list:', error);
      throw error;
    }

    console.log('Fetched shopping lists:', data);
    return (data || []).map(item => ({
      ...item,
      shopping_items: typeof item.shopping_items === 'object' ? 
        item.shopping_items as ShoppingList['shopping_items'] : 
        JSON.parse(item.shopping_items as string)
    }));
  } catch (error) {
    console.error('Error in fetchShoppingListByMenuId:', error);
    throw error;
  }
}

export async function fetchCalculationByMenuId(menuId: string): Promise<MenuCalculation[]> {
  console.log('Fetching calculations for menu ID:', menuId);
  
  try {
    const { data, error } = await supabase
      .from('menu_calculations')
      .select('*')
      .eq('menu_id', menuId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calculations:', error);
      throw error;
    }

    console.log('Fetched calculations:', data);
    return (data || []).map(calc => ({
      ...calc,
      cost_breakdown: typeof calc.cost_breakdown === 'object' ? 
        calc.cost_breakdown as MenuCalculation['cost_breakdown'] : 
        JSON.parse(calc.cost_breakdown as string)
    }));
  } catch (error) {
    console.error('Error in fetchCalculationByMenuId:', error);
    throw error;
  }
}

export async function fetchKitchenPlanByMenuId(menuId: string): Promise<KitchenPlan[]> {
  console.log('Fetching kitchen plans for menu ID:', menuId);
  
  try {
    const { data, error } = await supabase
      .from('kitchen_plans')
      .select('*')
      .eq('menu_id', menuId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kitchen plans:', error);
      throw error;
    }

    console.log('Fetched kitchen plans:', data);
    return (data || []).map(plan => ({
      ...plan,
      preparation_schedule: typeof plan.preparation_schedule === 'object' && Array.isArray((plan.preparation_schedule as any)?.tasks) ? 
        (plan.preparation_schedule as any).tasks as KitchenPlan['preparation_schedule'] : 
        [],
      mise_en_place: typeof plan.mise_en_place === 'object' && Array.isArray(plan.mise_en_place) ? 
        plan.mise_en_place as KitchenPlan['mise_en_place'] : 
        undefined,
      equipment_needed: typeof plan.equipment_needed === 'object' ? 
        plan.equipment_needed as KitchenPlan['equipment_needed'] : 
        undefined,
      staff_requirements: typeof plan.staff_requirements === 'object' ? 
        plan.staff_requirements as KitchenPlan['staff_requirements'] : 
        undefined,
      service_timeline: typeof plan.service_timeline === 'object' && Array.isArray(plan.service_timeline) ? 
        plan.service_timeline as KitchenPlan['service_timeline'] : 
        undefined
    }));
  } catch (error) {
    console.error('Error in fetchKitchenPlanByMenuId:', error);
    throw error;
  }
}

export async function fetchTotalCalculationForDateRange(
  dateFrom: string,
  dateTo: string,
  guestCount: number
): Promise<any> {
  console.log(`Fetching total calculation from ${dateFrom} to ${dateTo} for ${guestCount} guests`);
  
  try {
    // Fetch all menus in the date range
    const { data: menus, error: menusError } = await supabase
      .from('conference_menus')
      .select('*')
      .gte('menu_date', dateFrom)
      .lte('menu_date', dateTo)
      .order('menu_date');

    if (menusError) {
      console.error('Error fetching menus:', menusError);
      throw menusError;
    }

    if (!menus || menus.length === 0) {
      throw new Error('Keine Menüs im angegebenen Zeitraum gefunden');
    }

    // Fetch calculations for each menu
    const calculations = [];
    for (const menu of menus) {
      const calc = await fetchCalculationByMenuId(menu.id);
      if (calc && calc.length > 0) {
        calculations.push({
          date: menu.menu_date,
          calculation: calc[0],
          cost: calc[0].total_cost * guestCount,
          revenue: (calc[0].suggested_price || 0) * guestCount,
          profit: ((calc[0].suggested_price || 0) - calc[0].total_cost) * guestCount,
          margin: calc[0].profit_margin || 0
        });
      }
    }

    const totalCost = calculations.reduce((sum, calc) => sum + calc.cost, 0);
    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.revenue, 0);
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
        dayCount: calculations.length,
        totalCost,
        totalRevenue,
        totalProfit,
        overallMargin
      },
      daily_breakdown: calculations
    };
  } catch (error) {
    console.error('Error in fetchTotalCalculationForDateRange:', error);
    throw error;
  }
}

export async function generateKitchenData(
  menuId: string,
  type: 'recipes' | 'shopping_list' | 'calculation' | 'kitchen_plan',
  guestCount: number,
  guestDistribution: GuestDistribution
): Promise<{ success: boolean; error?: string }> {
  console.log(`Generating ${type} for menu ${menuId} with ${guestCount} guests`, guestDistribution);

  try {
    // Zuerst die kompletten Menü-Daten laden
    const { fetchMenuByDate } = await import('./menu-service');
    
    // Lade das komplette Menü mit allen Details
    const { data: menuData, error: menuError } = await supabase
      .from('conference_menus')
      .select('*')
      .eq('id', menuId)
      .single();

    if (menuError || !menuData) {
      console.error('Error loading menu data:', menuError);
      return {
        success: false,
        error: 'Menü-Daten konnten nicht geladen werden'
      };
    }

    console.log('Loaded complete menu data for AI:', {
      menuId,
      date: menuData.menu_date,
      hasLunchData: !!menuData.lunch_appetizer,
      hasDinnerData: !!menuData.dinner_appetizer,
      guestDistribution: {
        total: guestCount,
        dayGuests: guestDistribution.dayGuests,
        overnightGuests: guestDistribution.overnightGuests,
        vegetarian: guestDistribution.vegetarian,
        meat: guestDistribution.meat,
        fish: guestDistribution.fish
      }
    });

    const response = await supabase.functions.invoke('generate-kitchen-management', {
      body: {
        menuId,
        actionType: type,
        guestCount,
        guestDistribution: {
          dayGuests: guestDistribution.dayGuests,
          overnightGuests: guestDistribution.overnightGuests,
          vegetarian: guestDistribution.vegetarian,
          meat: guestDistribution.meat,
          fish: guestDistribution.fish
        },
        // Vollständige Menü-Daten für Master Prompt
        menuData: {
          id: menuData.id,
          menu_date: menuData.menu_date,
          lunch: {
            appetizer: menuData.lunch_appetizer,
            main_dish_fish: menuData.lunch_main_dish_fish,
            main_dish_meat: menuData.lunch_main_dish_meat,
            main_dish_vegetarian: menuData.lunch_main_dish_vegetarian,
            dessert: menuData.lunch_dessert
          },
          dinner: {
            appetizer: menuData.dinner_appetizer,
            main_dish_fish: menuData.dinner_main_dish_fish,
            main_dish_meat: menuData.dinner_main_dish_meat,
            main_dish_vegetarian: menuData.dinner_main_dish_vegetarian,
            dessert: menuData.dinner_dessert
          }
        }
      }
    });

    if (response.error) {
      console.error(`Error generating ${type}:`, response.error);
      return {
        success: false,
        error: response.error.message || 'Unbekannter Fehler beim Generieren'
      };
    }

    console.log(`Successfully generated ${type} with detailed guest distribution:`, response.data);
    return { success: true };
  } catch (error) {
    console.error(`Error in generateKitchenData for ${type}:`, error);
    return {
      success: false,
      error: (error as Error).message || 'Unbekannter Fehler'
    };
  }
}
