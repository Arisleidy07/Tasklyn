// ============================================
// TASKLYN — PayPal JS SDK v5 subscription types
// ============================================

declare global {
  type PayPalButtonComponent = {
    createSubscription: (
      data: unknown,
      actions: {
        subscription: {
          create: (options: { plan_id: string }) => Promise<string>;
        };
      },
    ) => Promise<string> | void;
    onApprove: (
      data: { subscriptionID: string; orderID?: string },
      actions?: unknown,
    ) => void | Promise<void>;
    onCancel?: (data: unknown) => void;
    onError?: (err: { message?: string }) => void;
    onClick?: () => void;
    style?: {
      color?: "gold" | "blue" | "silver" | "white" | "black";
      shape?: "rect" | "pill";
      layout?: "vertical" | "horizontal";
      label?: "subscribe" | "paypal" | "checkout";
      height?: number;
    };
  };

  type PayPalNamespace = {
    Buttons: (options: PayPalButtonComponent) => {
      render: (container: HTMLElement | string) => Promise<void>;
      close: () => void;
    };
    FUNDING?: Record<string, unknown>;
  };

  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
