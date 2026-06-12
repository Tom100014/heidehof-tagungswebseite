
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersService } from "@/services/orders/orders-service";
import { Order } from "@/types/order";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { cacheService } from "@/services/cache/cache-service";

export const useRealtimeOrders = () => {
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>([]);
  const queryClient = useQueryClient();

  // Safely use React Query with error handling
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      console.log("useRealtimeOrders: Loading latest orders");
      // Invalidate cache to get fresh data
      cacheService.invalidate('recent-orders');
      queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
      
      try {
        const allOrders = await ordersService.getRecentOrders(8);
        
        // Initialize realtime orders state if not already initialized
        if (realtimeOrders.length === 0) {
          console.log("useRealtimeOrders: Initializing realtime orders with", allOrders.length, "orders");
          setRealtimeOrders(allOrders as Order[]);
        }
        
        return allOrders as Order[];
      } catch (error) {
        console.error("Error fetching recent orders:", error);
        return [] as Order[];
      }
    },
    staleTime: 0, // Consider data always stale
    refetchInterval: 10000, // Automatically refetch every 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Manual refresh of orders
  const refreshOrders = () => {
    console.log("useRealtimeOrders: Manual refresh of orders");
    cacheService.invalidate('recent-orders');
    cacheService.invalidatePattern('orders');
    cacheService.invalidatePattern('recentOrders');
    
    // React Query Cache auch leeren
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
    
    refetch().catch(err => console.error("Error refetching orders:", err));
  };

  // Effect to refresh orders when the component mounts, window regains focus, or new order is created
  useEffect(() => {
    console.log("useRealtimeOrders: Setting up refresh handlers");
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("useRealtimeOrders: Page became visible, refreshing orders");
        refreshOrders();
      }
    };
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'new_order_created' || event.key === 'last_publish_timestamp') {
        console.log("useRealtimeOrders: New order detected from localStorage, refreshing orders");
        refreshOrders();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshOrders);
    window.addEventListener('storage', handleStorageChange);
    
    // Initial refresh
    refreshOrders();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshOrders);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Realtime subscription for regular orders
  useRealtimeSubscription({
    table: 'orders',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime order (orders):", payload);
      if (payload.new) {
        updateOrdersState([{
          id: payload.new.id,
          customer_name: payload.new.customer_name || '',
          room_number: payload.new.room_number || '',
          created_at: payload.new.created_at,
          items: 'Loading...',
          status: payload.new.status,
          department: 'room_service',
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new orders are received
        refreshOrders();
      }
    }
  });

  // Realtime subscription for restaurant orders
  useRealtimeSubscription({
    table: 'restaurant_orders',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime order (restaurant_orders):", payload);
      if (payload.new) {
        const newData = payload.new;
        updateOrdersState([{
          id: newData.id,
          customer_name: newData.name,
          room_number: newData.zustellort || '',
          created_at: newData.created_at,
          items: newData.speisen,
          status: newData.status || 'pending',
          department: 'restaurant',
          kategorie: newData.kategorie,
          priority: newData.kategorie === 'Essen/Trinken' || Boolean(newData.priority),
          highlight: newData.kategorie === 'Essen/Trinken' || Boolean(newData.priority),
          timestamp: new Date(newData.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new orders are received
        refreshOrders();
      }
    },
    channelName: 'restaurant-orders-changes'
  });

  // Realtime subscription for bar max orders
  useRealtimeSubscription({
    table: 'bar_max_orders',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime order (bar_max_orders):", payload);
      if (payload.new) {
        const newData = payload.new;
        updateOrdersState([{
          id: newData.id,
          customer_name: newData.customer_name,
          room_number: newData.room_number || newData.table_number || '',
          created_at: newData.created_at,
          items: newData.items_text,
          status: newData.status || 'pending',
          department: 'bar_max',
          priority: Boolean(newData.priority),
          highlight: Boolean(newData.priority),
          timestamp: new Date(newData.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new orders are received
        refreshOrders();
      }
    },
    channelName: 'bar-max-orders-changes'
  });

  // Realtime subscription for restaurant bar orders (Restaurant Maxwell & Bar Mäx Snacks)
  useRealtimeSubscription({
    table: 'restaurant_bar_orders',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime order (restaurant_bar_orders):", payload);
      if (payload.new) {
        const newData = payload.new;
        updateOrdersState([{
          id: newData.id,
          customer_name: newData.customer_name,
          room_number: newData.room_number || newData.delivery_location || '',
          created_at: newData.created_at,
          items: newData.items_text,
          status: newData.status || 'pending',
          department: newData.order_type === 'restaurant_maxwell' ? 'restaurant_maxwell' : 
                      (newData.order_type === 'bar_max_snacks' ? 'bar_max_snacks' : 'bar_max'),
          priority: Boolean(newData.priority),
          highlight: Boolean(newData.priority),
          timestamp: new Date(newData.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new orders are received
        refreshOrders();
      }
    },
    channelName: 'restaurant-bar-orders-changes'
  });

  // Realtime subscription for admin messages
  useRealtimeSubscription({
    table: 'admin_messages',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime admin message:", payload);
      if (payload.new) {
        const newData = payload.new;
        updateOrdersState([{
          id: newData.id,
          customer_name: newData.customer_name || 'Admin Nachricht',
          room_number: newData.room_number || '',
          created_at: newData.created_at,
          items: newData.message_content || 'Admin Nachricht',
          status: newData.status || 'sent',
          department: 'admin_message',
          kategorie: newData.message_type || 'Admin Nachricht',
          priority: Boolean(newData.priority),
          highlight: Boolean(newData.priority),
          timestamp: new Date(newData.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new messages are received
        refreshOrders();
      }
    },
    channelName: 'admin-messages-changes'
  });

  // Realtime subscription for conference orders
  useRealtimeSubscription({
    table: 'conference_orders',
    event: '*',
    onData: (payload) => {
      console.log("useRealtimeOrders: Received realtime order (conference_orders):", payload);
      if (payload.new) {
        const newData = payload.new;
        
        // Parse guest_info
        let guestInfo: any = {};
        try {
          guestInfo = typeof newData.guest_info === 'string' 
            ? JSON.parse(newData.guest_info) 
            : newData.guest_info || {};
        } catch (e) {
          console.warn('Konnte guest_info nicht parsen:', e);
        }

        updateOrdersState([{
          id: newData.id,
          customer_name: guestInfo?.name || 'Konferenz-Gast',
          room_number: guestInfo?.conferenceRoom || 'Konferenz',
          created_at: newData.created_at,
          items: `Konferenz-Menü für ${newData.order_date}`,
          status: newData.status || 'new',
          department: 'conference',
          kategorie: 'Konferenz-Bestellung',
          contact_value: 'Konferenz-Service',
          notes: `Firma: ${guestInfo?.company || 'Nicht angegeben'}`,
          order_date: newData.order_date,
          lunch_menu: newData.lunch_menu,
          dinner_menu: newData.dinner_menu,
          guest_info: newData.guest_info,
          priority: true,
          highlight: true,
          timestamp: new Date(newData.created_at).toLocaleString('de-DE')
        } as Order]);
        
        // Always invalidate cache and reload when new orders are received
        refreshOrders();
      }
    },
    channelName: 'conference-orders-changes'
  });

  // Helper function to update the orders state
  const updateOrdersState = (newOrders: Order[]) => {
    console.log("useRealtimeOrders: Updating orders state with", newOrders.length, "new orders");
    setRealtimeOrders(prevOrders => {
      const orderMap = new Map(prevOrders.map(order => [order.id, order]));
      newOrders.forEach(newOrder => {
        orderMap.set(newOrder.id, newOrder);
      });
      return Array.from(orderMap.values())
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 8);
    });
  };

  const displayOrders = (realtimeOrders.length > 0 ? realtimeOrders : orders || []);

  const newOrdersCount = displayOrders?.filter(
    order => order.status === 'pending' || order.status === 'offen'
  ).length || 0;

  return {
    orders: displayOrders,
    isLoading,
    newOrdersCount,
    refreshOrders
  };
};
