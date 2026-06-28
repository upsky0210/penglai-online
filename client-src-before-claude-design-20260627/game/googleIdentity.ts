type GoogleCredentialCallback = (credential: string) => void;

interface GoogleIdentityResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (response: GoogleIdentityResponse) => void }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme: "outline" | "filled_blue" | "filled_black";
      size: "large" | "medium" | "small";
      text: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape: "rectangular" | "pill" | "circle" | "square";
      width: number;
    }
  ): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let googleScriptPromise: Promise<void> | undefined;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  googleScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Identity Services failed to load.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function renderGoogleSignInButton(
  parent: HTMLElement,
  clientId: string,
  onCredential: GoogleCredentialCallback
) {
  await loadGoogleIdentityScript();
  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error("Google Identity Services is unavailable.");
  }

  googleId.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    }
  });
  googleId.renderButton(parent, {
    theme: "filled_blue",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    width: 240
  });
}
