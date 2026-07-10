import type { IncomingMessage, ServerResponse } from "node:http";

type AdminHandler = (request: IncomingMessage, response: ServerResponse, url: URL) => void | Promise<void>;

export interface AdminApiOptions {
  adminToken: string;
  sendJson: (response: ServerResponse, statusCode: number, body: unknown) => void;
  routes: Record<string, AdminHandler>;
}

export class AdminApi {
  constructor(private readonly options: AdminApiOptions) {}

  async handle(request: IncomingMessage, response: ServerResponse, url: URL) {
    if (!url.pathname.startsWith("/admin/")) {
      return false;
    }

    const route = this.options.routes[`${request.method ?? "GET"} ${url.pathname}`];
    if (!route) {
      this.options.sendJson(response, 404, { error: "not_found" });
      return true;
    }

    if (!this.options.adminToken) {
      this.options.sendJson(response, 503, { error: "admin_api_not_configured" });
      return true;
    }
    if (url.searchParams.get("token") !== this.options.adminToken) {
      this.options.sendJson(response, 403, { error: "admin_token_required" });
      return true;
    }

    await route(request, response, url);
    return true;
  }
}
