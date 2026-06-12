import { useState, useMemo } from 'react';

export interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export interface PaginationResult<T> {
  // Current data
  currentData: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  
  // Navigation
  canGoToPrevious: boolean;
  canGoToNext: boolean;
  
  // Actions
  goToPage: (page: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  setPageSize: (size: number) => void;
  
  // Pagination metadata
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const usePagination = <T>(
  data: T[],
  options: PaginationOptions = {}
): PaginationResult<T> => {
  const { 
    initialPage = 1, 
    initialPageSize = 20 
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure current page is valid
  const validatedCurrentPage = useMemo(() => {
    if (currentPage < 1) return 1;
    if (currentPage > totalPages && totalPages > 0) return totalPages;
    return currentPage;
  }, [currentPage, totalPages]);

  // Calculate start and end indices
  const startIndex = (validatedCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Get current page data
  const currentData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation helpers
  const canGoToPrevious = validatedCurrentPage > 1;
  const canGoToNext = validatedCurrentPage < totalPages;
  const hasNextPage = canGoToNext;
  const hasPreviousPage = canGoToPrevious;

  // Actions
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const goToPrevious = () => {
    if (canGoToPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (canGoToNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleSetPageSize = (size: number) => {
    const newPageSize = Math.max(1, size);
    setPageSize(newPageSize);
    
    // Adjust current page if necessary
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    if (validatedCurrentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };

  // Reset to first page when data changes significantly
  useMemo(() => {
    if (totalPages > 0 && validatedCurrentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, validatedCurrentPage]);

  return {
    currentData,
    currentPage: validatedCurrentPage,
    pageSize,
    totalItems,
    totalPages,
    canGoToPrevious,
    canGoToNext,
    goToPage,
    goToPrevious,
    goToNext,
    setPageSize: handleSetPageSize,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
  };
};

export default usePagination;