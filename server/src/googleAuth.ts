import { OAuth2Client } from "google-auth-library";

export interface VerifiedGoogleProfile {
  subject: string;
  email?: string;
  hostedDomain?: string;
  displayName?: string;
}

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "invalid_token" | "hosted_domain_not_allowed"
  ) {
    super(message);
  }
}

export class GoogleAuthVerifier {
  private readonly client: OAuth2Client;

  constructor(
    private readonly clientId: string,
    private readonly allowedHostedDomain: string
  ) {
    this.client = new OAuth2Client(clientId || undefined);
  }

  get isConfigured() {
    return Boolean(this.clientId);
  }

  async verifyCredential(credential: string): Promise<VerifiedGoogleProfile> {
    if (!this.clientId) {
      throw new GoogleAuthError("Google auth is not configured.", "not_configured");
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId
      });
      const payload = ticket.getPayload();

      if (!payload?.sub) {
        throw new GoogleAuthError("Google token does not contain a subject.", "invalid_token");
      }

      if (this.allowedHostedDomain && payload.hd !== this.allowedHostedDomain) {
        throw new GoogleAuthError("Google account is outside the allowed school domain.", "hosted_domain_not_allowed");
      }

      return {
        subject: payload.sub,
        email: payload.email,
        hostedDomain: payload.hd,
        displayName: payload.name
      };
    } catch (error) {
      if (error instanceof GoogleAuthError) {
        throw error;
      }

      throw new GoogleAuthError("Google token verification failed.", "invalid_token");
    }
  }
}
