import { handleError, AppError, ErrorType } from "./error-handler";

class NetworkMonitor {
  private isOnline: boolean = true;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Monitor network quality
      this.monitorNetworkQuality();
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.retryAttempts = 0;
    
    if (!navigator.onLine) {
      // Double check with a network request
      this.checkConnectivity();
    }
  }

  private handleOffline() {
    this.isOnline = false;
    handleError(new AppError(ErrorType.CONNECTION_LOST));
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      this.isOnline = response.ok;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  private monitorNetworkQuality() {
    // Check if Network Information API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        connection.addEventListener('change', () => {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            handleError(new AppError(ErrorType.NETWORK_ERROR));
          }
        });
      }
    }
  }

  public async retryRequest<T>(
    requestFn: () => Promise<T>,
    errorContext?: string
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (!this.isOnline) {
        handleError(new AppError(ErrorType.CONNECTION_LOST));
        throw error;
      }

      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        
        // Exponential backoff
        const delay = Math.pow(2, this.retryAttempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.retryRequest(requestFn, errorContext);
      }

      // Max retries reached
      handleError(new AppError(ErrorType.NETWORK_ERROR, error as Error));
      throw error;
    }
  }

  public getNetworkStatus(): {
    isOnline: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const connection = (navigator as any).connection;
    
    return {
      isOnline: this.isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }
}

export const networkMonitor = new NetworkMonitor(); 