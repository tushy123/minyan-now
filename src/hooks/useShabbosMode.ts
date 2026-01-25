import { useState, useEffect } from "react";

/**
 * Check if it's currently Shabbos (Friday after 6pm or Saturday)
 * In a real app, this should use proper zmanim calculations
 */
export function useShabbosMode() {
  const [isShabbos, setIsShabbos] = useState(false);

  useEffect(() => {
    const checkShabbos = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      // Simple heuristic: Friday after 6pm or all of Saturday
      // In production, use proper zmanim for sunset
      const shabbos = (day === 5 && hour >= 18) || day === 6;
      setIsShabbos(shabbos);
    };

    checkShabbos();

    // Check every minute
    const interval = setInterval(checkShabbos, 60000);

    return () => clearInterval(interval);
  }, []);

  return isShabbos;
}
