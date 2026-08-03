// Minimal shape for the parts of Google Identity Services (the
// accounts.google.com/gsi/client script loaded in index.html) this app
// actually uses - not an exhaustive typing of Google's API.
export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number; text?: string }
          ) => void;
        };
      };
    };
  }
}
