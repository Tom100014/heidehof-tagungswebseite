
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Order, OrderItem, parseOrderItems } from "@/types/order";
import { safeMapItems } from "@/utils/order-utils";
import { useOrderStatus } from "@/hooks/use-order-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminOrderItemProps {
  order: Order;
  onUpdate?: (updatedOrder: Order) => void;
  showActions?: boolean;
}

const AdminOrderItem = ({ order, onUpdate, showActions = true }: AdminOrderItemProps) => {
  const { toast } = useToast();
  const [highlightBorder, setHighlightBorder] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { handleDeleteOrder, isDeleting } = useOrderStatus();

  useEffect(() => {
    // Highlight the border briefly when the component is first rendered
    setHighlightBorder(true);
    const timer = setTimeout(() => {
      setHighlightBorder(false);
    }, 2000); // Highlight for 2 seconds
    return () => clearTimeout(timer); // Clear timeout if component unmounts
  }, []);
  
  // Debug log to check what order data we have
  useEffect(() => {
    console.log("AdminOrderItem: Rendering order:", { 
      id: order.id, 
      name: order.customer_name, 
      status: order.status, 
      dept: order.department,
      priority: order.priority
    });
  }, [order]);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    handleDeleteOrder(order.id, order.department);
    setIsDeleteDialogOpen(false);
  };

  // Format order items for display with improved layout
  const formatOrderItems = (items: string | OrderItem[]) => {
    // Use safeMapItems to ensure we're working with an array of OrderItems
    const parsedItems = safeMapItems(items);
    
    return (
      <div className="text-sm">
        {parsedItems.map((item, index) => (
          <div key={index} className="flex items-start mb-1">
            <span className="font-medium whitespace-nowrap mr-1">{item.quantity}x</span>
            <span className="line-clamp-1">{item.name}</span>
          </div>
        ))}
        {parsedItems.length > 3 && (
          <span className="text-xs text-muted-foreground">
            ...und {parsedItems.length - 3} weitere
          </span>
        )}
      </div>
    );
  };
  
  // Helper function to convert a status to its display text
  const getStatusDisplayText = (status: Order['status']): string => {
    switch (status) {
      case 'offen':
      case 'pending':
        return 'Neu';
      case 'in_bearbeitung':
      case 'processing':
        return 'In Bearbeitung';
      case 'abgeschlossen':
      case 'completed':
        return 'Abgeschlossen';
      case 'storniert':
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };
  
  // Helper function to normalize status for comparison
  const normalizeStatus = (status: Order['status']): 'pending' | 'processing' | 'completed' | 'cancelled' => {
    if (status === 'offen') return 'pending';
    if (status === 'in_bearbeitung') return 'processing';
    if (status === 'abgeschlossen') return 'completed';
    if (status === 'storniert') return 'cancelled';
    return status as 'pending' | 'processing' | 'completed' | 'cancelled';
  };

  // Get the correct status badge styling based on the status
  const getStatusBadgeClass = (status: Order['status']) => {
    // Normalize status for consistent styling
    const normalizedStatus = normalizeStatus(status);
    
    return cn(
      "capitalize text-sm",
      normalizedStatus === "pending" && "bg-yellow-500 text-black",
      normalizedStatus === "processing" && "bg-blue-500 text-white",
      normalizedStatus === "completed" && "bg-zinc-500 text-white",
      normalizedStatus === "cancelled" && "bg-red-500 text-white"
    );
  };

  return (
    <>
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border transition-all duration-300",
        highlightBorder && "border-gold",
        order.priority && !highlightBorder && "border-red-300"
      )}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {order.customer_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {typeof order.room_number === 'number' ? `Zimmer ${order.room_number}` : order.room_number}
            </span>
            {order.priority && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Priorität</Badge>
            )}
          </div>
          <div className="max-w-md">
            {formatOrderItems(order.items)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{order.timestamp}</span>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={getStatusBadgeClass(order.status)}
            >
              {getStatusDisplayText(order.status)}
            </Badge>
            {isDeleting ? (
              <Button variant="secondary" disabled>
                Löschen...
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestellung löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Bestellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminOrderItem;
