/**
 * Trade API Service
 *
 * Handles posting trade data to the backend instead of signing blockchain transactions.
 * This replaces the wallet-based transaction signing flow.
 */

export interface TradeOrderPayload {
  userId: string;
  orderType: "market" | "limit" | "stop-loss" | "take-profit";
  side: "long" | "short";
  marketAddress: string;
  marketSymbol: string;
  sizeDeltaUsd: string;
  collateralDeltaUsd: string;
  triggerPrice?: string;
  acceptablePrice: string;
  leverage: number;
  isLong: boolean;
  chainId: number;
  // Additional metadata
  metadata?: {
    referralCode?: string;
    slippageBps?: number;
  };
}

export interface TradeResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
}

export interface ClosePositionPayload {
  userId: string;
  positionKey: string;
  marketAddress: string;
  sizeDeltaUsd: string;
  acceptablePrice: string;
  isLong: boolean;
  chainId: number;
}

// Base API URL - should be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_TRADE_API_URL || "/api";

class TradeApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const authData = localStorage.getItem("vanta_auth");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (authData) {
      try {
        const user = JSON.parse(authData);
        headers["X-User-Id"] = user.id;
      } catch {
        // Ignore parse errors
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Submit a new trade order
   */
  async submitOrder(order: TradeOrderPayload): Promise<TradeResponse> {
    return this.request<TradeResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  /**
   * Close an existing position
   */
  async closePosition(payload: ClosePositionPayload): Promise<TradeResponse> {
    return this.request<TradeResponse>("/positions/close", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: string): Promise<TradeResponse> {
    return this.request<TradeResponse>(`/orders/${orderId}/cancel`, {
      method: "POST",
    });
  }

  /**
   * Get user's orders
   */
  async getOrders(userId: string): Promise<TradeOrderPayload[]> {
    return this.request<TradeOrderPayload[]>(`/orders?userId=${userId}`);
  }

  /**
   * Get user's positions
   */
  async getPositions(userId: string): Promise<unknown[]> {
    return this.request<unknown[]>(`/positions?userId=${userId}`);
  }
}

// Export singleton instance
export const tradeApi = new TradeApiService();

export default tradeApi;
