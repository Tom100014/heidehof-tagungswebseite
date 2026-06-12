
import React from 'react';
import ProfessionalBreadcrumb from './ProfessionalBreadcrumb';

// Legacy component - now uses ProfessionalBreadcrumb
const NavigationBreadcrumb = () => {
  return (
    <ProfessionalBreadcrumb 
      variant="default" 
      showHomeButton={false}
    />
  );
};

export default NavigationBreadcrumb;
