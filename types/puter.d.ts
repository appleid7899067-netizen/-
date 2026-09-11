declare global {
  interface Window {
    puter?: {
      auth: {
        signIn: (options?: {
          attempt_temp_user_creation?: boolean;
          request_auth?: boolean;
        }) => Promise<unknown>;
        signOut: () => void | Promise<void>;
        isSignedIn: () => boolean;
        getUser: () => Promise<{
          username?: string;
          email?: string;
          uuid?: string;
          [key: string]: unknown;
        }>;
      };
    };
  }
}

export {};
