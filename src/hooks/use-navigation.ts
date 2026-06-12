
import { useNavigate } from 'react-router-dom';
import React, { useCallback } from 'react';
import NavigationService from '@/services/navigation/navigation.service';

export const useNavigation = () => {
  const navigate = useNavigate();
  const navigationService = NavigationService.getInstance();
  
  // Set navigate function in service
  navigationService.setNavigate(navigate);

  const goBack = useCallback(() => {
    return navigationService.goBack();
  }, [navigationService]);

  const goHome = useCallback(() => {
    navigationService.goHome();
  }, [navigationService]);

  const getPreviousPage = useCallback(() => {
    return navigationService.getPreviousPage();
  }, [navigationService]);

  const addToHistory = useCallback((path: string, title: string) => {
    navigationService.addToHistory(path, title);
  }, [navigationService]);

  return {
    goBack,
    goHome,
    getPreviousPage,
    addToHistory
  };
};
