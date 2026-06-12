
import { NavigateFunction } from 'react-router-dom';

interface NavigationHistory {
  path: string;
  title: string;
  timestamp: number;
}

class NavigationService {
  private static instance: NavigationService;
  private navigate: NavigateFunction | null = null;
  private history: NavigationHistory[] = [];
  private maxHistorySize = 10;

  private constructor() {}

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  addToHistory(path: string, title: string) {
    // Verhindere Duplikate
    if (this.history.length > 0 && this.history[this.history.length - 1].path === path) {
      return;
    }
    
    this.history.push({
      path,
      title,
      timestamp: Date.now()
    });

    // Begrenze History-Größe
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  goBack(): boolean {
    if (!this.navigate) return false;
    
    // Entferne aktuelle Seite und gehe zur vorherigen
    if (this.history.length > 1) {
      this.history.pop(); // Entferne aktuelle Seite
      const previous = this.history[this.history.length - 1];
      this.navigate(previous.path);
      return true;
    } else {
      this.goHome();
      return true;
    }
  }

  goHome() {
    if (!this.navigate) return;
    this.navigate('/');
  }

  getPreviousPage(): NavigationHistory | null {
    return this.history.length > 1 ? this.history[this.history.length - 2] : null;
  }

  getBreadcrumbs(currentPath: string): NavigationHistory[] {
    return this.history.filter(item => item.path !== currentPath);
  }

  getHistory(): NavigationHistory[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }
}

export default NavigationService;
