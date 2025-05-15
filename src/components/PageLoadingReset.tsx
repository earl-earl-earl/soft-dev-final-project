"use client";

import { useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';

export default function PageLoadingReset() {
  const { setIsLoading } = useLoading();
  
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);
  
  return null;
}