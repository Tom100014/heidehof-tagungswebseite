
import React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  
  // Initialize theme from localStorage after mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system')) {
        setThemeState(storedTheme);
      } else {
        setThemeState('dark');
        localStorage.setItem(storageKey, 'dark');
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setThemeState('dark');
    }
  }, [storageKey]);

  // Apply theme to document
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      
      let effectiveTheme = theme;
      if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      
      root.classList.add(effectiveTheme);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      setThemeState(newTheme);
    }
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
