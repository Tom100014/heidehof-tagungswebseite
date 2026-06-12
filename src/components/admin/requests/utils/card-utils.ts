
export const getDepartmentLabel = (department?: string, kategorie?: string) => {
  switch(department) {
    case 'restaurant':
    case 'restaurant_maxwell':
      return "Restaurant Maxwell";
    case 'bar':
    case 'bar_max':
      return "Mäx Bar";
    case 'beauty':
    case 'beauty_treatment':
      return "Beauty Behandlung";
    case 'room_service':
      return "Room Service";
    default:
      if (kategorie === 'Essen/Trinken') {
        return "Restaurant Maxwell";
      } else if (kategorie === 'Tischreservierung') {
        return "Tischreservierung";
      } else if (kategorie === 'Beschwerde') {
        return "Beschwerde";
      } else if (kategorie === 'Tagungsmenü') {
        return "Tagungsmenü";
      }
      return "Allgemein";
  }
};

export const getDepartmentBadgeColor = (department?: string, kategorie?: string) => {
  switch(department) {
    case 'restaurant':
    case 'restaurant_maxwell':
      return "bg-amber-500 text-white";
    case 'bar':
    case 'bar_max':
      return "bg-purple-500 text-white";
    case 'beauty':
    case 'beauty_treatment':
      return "bg-pink-500 text-white";
    case 'room_service':
      return "bg-blue-500 text-white";
    default:
      if (kategorie === 'Essen/Trinken') {
        return "bg-amber-500 text-white";
      } else if (kategorie === 'Tischreservierung') {
        return "bg-zinc-500 text-white";
      } else if (kategorie === 'Beschwerde') {
        return "bg-red-500 text-white";
      } else if (kategorie === 'Tagungsmenü') {
        return "bg-indigo-500 text-white";
      }
      return "bg-gray-500 text-white";
  }
};

export const getCardColors = (isHighPriority: boolean, isNew: boolean, department?: string, kategorie?: string) => {
  if (isHighPriority) {
    return "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800";
  }
  
  if (isNew) {
    return "border-gold border-2";
  }
  
  switch(department) {
    case 'restaurant':
    case 'restaurant_maxwell':
      return "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800";
    case 'bar':
    case 'bar_max':
      return "border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800";
    case 'beauty':
    case 'beauty_treatment':
      return "border-pink-300 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800";
    case 'room_service':
      return "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800";
    default:
      if (kategorie === 'Tischreservierung') {
        return "border-zinc-300 bg-zinc-50 dark:bg-zinc-900/20 dark:border-zinc-800";
      } else if (kategorie === 'Beschwerde') {
        return "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800";
      } else if (kategorie === 'Tagungsmenü') {
        return "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800";
      }
      return ""; // default card styling
  }
};
