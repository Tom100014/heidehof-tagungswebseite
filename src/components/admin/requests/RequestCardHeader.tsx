
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Star } from "lucide-react";
import { Order } from "@/types/order";

interface RequestCardHeaderProps {
  order: Order;
  isNew: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  isHighPriority: boolean;
  getDepartmentLabel: () => string;
  getDepartmentBadgeColor: () => string;
}

// Minimale Zeit-Formatierung für bessere Lesbarkeit
const formatMinimalTime = (timestamp: string | undefined): string => {
  if (!timestamp) return 'Unbekannt';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    // Heute
    if (days === 0) {
      if (minutes < 1) return 'Jetzt';
      if (minutes < 60) return `vor ${minutes}min`;
      return `vor ${hours}h`;
    }
    
    // Gestern
    if (days === 1) {
      return `Gestern ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Diese Woche
    if (days < 7) {
      const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return `${weekdays[date.getDay()]} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Datum mit Zeit
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    return 'Ungültig';
  }
};

export const RequestCardHeader: React.FC<RequestCardHeaderProps> = ({
  order,
  isNew,
  isInProgress,
  isCompleted,
  isHighPriority,
  getDepartmentLabel,
  getDepartmentBadgeColor
}) => {
  const getStatusText = () => {
    if (isNew) return "Neu";
    if (isInProgress) return "Bearbeitung";
    if (isCompleted) return "Fertig";
    return "Unbekannt";
  };

  const getStatusColor = () => {
    if (isNew) return "bg-orange-100 text-orange-700 border-orange-200";
    if (isInProgress) return "bg-blue-100 text-blue-700 border-blue-200";
    if (isCompleted) return "bg-zinc-100 text-zinc-700 border-zinc-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const minimalTime = formatMinimalTime(order.timestamp || order.created_at);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
      {/* Kompakter Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium text-gray-800">
            {order.customer_name || 'Unbekannter Gast'}
          </h2>
          
          {isHighPriority && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full">
              <Star className="w-3 h-3 text-red-500 fill-red-500" />
              <span className="text-xs font-medium text-red-700">Priorität</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor()} border font-medium px-2 py-1 text-xs`}>
            {getStatusText()}
          </Badge>
          <Badge className={`${getDepartmentBadgeColor()} border font-medium px-2 py-1 text-xs`}>
            {getDepartmentLabel()}
          </Badge>
        </div>
      </div>

      {/* Kompakte Informationszeile */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="font-medium text-gray-700">{minimalTime}</span>
        </div>
        
        {order.room_number && (
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-700">
              {order.kategorie === 'Tischreservierung' ? 'T' : 'Z'}: {order.room_number}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
