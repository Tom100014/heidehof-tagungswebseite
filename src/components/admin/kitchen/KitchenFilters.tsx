import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Calendar, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
interface KitchenFiltersProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
  selectedSendMethod: string[];
  onSendMethodChange: (methods: string[]) => void;
  selectedRoom: string[];
  onRoomChange: (rooms: string[]) => void;
  onClearFilters: () => void;
}
const STATUS_OPTIONS = [{
  value: 'new',
  label: 'Neu',
  icon: Clock,
  color: 'bg-blue-100 text-blue-800'
}, {
  value: 'confirmed',
  label: 'Bestätigt',
  icon: CheckCircle,
  color: 'bg-zinc-100 text-zinc-800'
}, {
  value: 'preparing',
  label: 'In Vorbereitung',
  icon: AlertCircle,
  color: 'bg-yellow-100 text-yellow-800'
}, {
  value: 'ready',
  label: 'Bereit',
  icon: CheckCircle,
  color: 'bg-zinc-100 text-zinc-800'
}];
const SEND_METHOD_OPTIONS = [{
  value: 'whatsapp',
  label: 'WhatsApp'
}, {
  value: 'sms',
  label: 'SMS'
}, {
  value: 'copy',
  label: 'Kopiert'
}];
const ROOM_OPTIONS = ['Berlin', 'Hamburg', 'Frankfurt', 'Bonn'];
const KitchenFilters: React.FC<KitchenFiltersProps> = ({
  selectedDate,
  onDateChange,
  selectedStatus,
  onStatusChange,
  selectedSendMethod,
  onSendMethodChange,
  selectedRoom,
  onRoomChange,
  onClearFilters
}) => {
  const hasActiveFilters = selectedStatus.length > 0 || selectedSendMethod.length > 0 || selectedRoom.length > 0;
  const toggleStatus = (status: string) => {
    if (selectedStatus.includes(status)) {
      onStatusChange(selectedStatus.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatus, status]);
    }
  };
  const toggleSendMethod = (method: string) => {
    if (selectedSendMethod.includes(method)) {
      onSendMethodChange(selectedSendMethod.filter(m => m !== method));
    } else {
      onSendMethodChange([...selectedSendMethod, method]);
    }
  };
  const toggleRoom = (room: string) => {
    if (selectedRoom.includes(room)) {
      onRoomChange(selectedRoom.filter(r => r !== room));
    } else {
      onRoomChange([...selectedRoom, room]);
    }
  };
  return <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6 bg-slate-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filter & Suche</h3>
          </div>
          {hasActiveFilters && <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4 mr-1" />
              Filter zurücksetzen
            </Button>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 bg-slate-50">Datum</label>
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border bg-slate-100">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input type="date" value={selectedDate} onChange={e => onDateChange(e.target.value)} className="text-sm font-medium bg-transparent border-none outline-none text-gray-900 w-full" />
            </div>
          </div>

          {/* Status */}
          <div className="bg-slate-50">
            <label className="block text-sm font-medium text-gray-700 mb-2 bg-slate-50">Status</label>
            <div className="flex flex-wrap gap-2 bg-gray-50">
              {STATUS_OPTIONS.map(option => {
              const Icon = option.icon;
              const isSelected = selectedStatus.includes(option.value);
              return <Badge key={option.value} variant={isSelected ? "default" : "outline"} className={`cursor-pointer transition-colors bg-black text-white hover:bg-gray-800 ${isSelected ? 'border-white' : 'border-gray-600'}`} onClick={() => toggleStatus(option.value)}>
                    <Icon className="w-3 h-3 mr-1" />
                    {option.label}
                  </Badge>;
            })}
            </div>
          </div>

          {/* Versandmethode */}
          <div className="bg-slate-50">
            <label className="block text-sm font-medium text-gray-700 mb-2 bg-slate-50">Versandmethode</label>
            <div className="flex flex-wrap gap-2">
              {SEND_METHOD_OPTIONS.map(option => {
              const isSelected = selectedSendMethod.includes(option.value);
              return <Badge key={option.value} variant={isSelected ? "default" : "outline"} onClick={() => toggleSendMethod(option.value)} className="cursor-pointer transition-colors bg-slate-950">
                    {option.label}
                  </Badge>;
            })}
            </div>
          </div>

          {/* Tagungsräume */}
          <div className="bg-slate-50">
            <label className="block text-sm font-medium text-gray-700 mb-2 bg-slate-50">Tagungsräume</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_OPTIONS.map(room => {
              const isSelected = selectedRoom.includes(room);
              return <Badge key={room} variant={isSelected ? "default" : "outline"} onClick={() => toggleRoom(room)} className="cursor-pointer transition-colors bg-slate-950">
                    {room}
                  </Badge>;
            })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default KitchenFilters;