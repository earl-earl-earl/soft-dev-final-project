import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

/**
 * Portal component that renders its children outside the normal DOM hierarchy
 * Useful for modals, tooltips, and other overlay components
 */
const Portal: React.FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Server-side rendering check - only render on client
  if (!mounted) return null;
  
  // Create portal to render children outside of parent DOM hierarchy
  return createPortal(
    children,
    document.getElementById('portal-root') || document.body
  );
};

export default Portal;