import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function useThemeMount() {
  const { theme, systemTheme, resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Set mounted to true after the component mounts
  }, []);

  // Prevent rendering until the theme is resolved
  const currentTheme = isMounted ? (theme === 'system' ? systemTheme : resolvedTheme) : null;

  return { isMounted, currentTheme };
}

