import { useState, useEffect } from 'react';

interface FavoriteEvent {
  id: string;
  title: string;
  category: string;
  addedAt: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ingolstadt-favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ingolstadt-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (event: any, category: string) => {
    const favoriteEvent: FavoriteEvent = {
      id: event.id || `${event.title}-${event.location}`,
      title: event.title,
      category,
      addedAt: new Date().toISOString()
    };

    setFavorites(prev => {
      // Avoid duplicates
      const exists = prev.some(fav => fav.id === favoriteEvent.id);
      if (exists) return prev;
      
      return [...prev, favoriteEvent];
    });
  };

  const removeFavorite = (eventId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== eventId));
  };

  const toggleFavorite = (event: any, category: string) => {
    const eventId = event.id || `${event.title}-${event.location}`;
    const isFavorited = favorites.some(fav => fav.id === eventId);
    
    if (isFavorited) {
      removeFavorite(eventId);
    } else {
      addFavorite(event, category);
    }
  };

  const isFavorited = (event: any) => {
    const eventId = event.id || `${event.title}-${event.location}`;
    return favorites.some(fav => fav.id === eventId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    favoritesCount: favorites.length
  };
};