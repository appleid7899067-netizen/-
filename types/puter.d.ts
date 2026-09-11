type PuterChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

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
      ai: {
        chat: (
          messages:
            | string
            | PuterChatMessage[],
          options?: {
            model?: string;
            stream?: boolean;
            [key: string]: unknown;
          }
        ) => Promise<AsyncIterable<{ text?: string; done?: boolean }>>;
        listModels: () => Promise<unknown>;
      };
    };
  }
}

export {};
