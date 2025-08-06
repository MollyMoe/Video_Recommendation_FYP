export {};

declare global {
  interface Window {
    electron?: {
      saveSession: (data: any) => void;
      getSession: () => any;
      deleteSession?: () => void;
    };
  }
}