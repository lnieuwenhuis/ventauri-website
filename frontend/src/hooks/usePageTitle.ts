import { useEffect } from 'react';

const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} - Ventauri Esports`;
    
    // Cleanup function to restore previous title if needed
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;