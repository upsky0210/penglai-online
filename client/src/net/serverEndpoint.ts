// Resolves where the game server lives. Three supported deployments:
// - Vite dev (localhost / 127.0.0.1 / :5173 / :5174): server on the same host at :8787.
// - Same-origin production (nginx reverse proxy): /ws and the HTTP API on this origin.
// - Client hosted apart from the server (e.g. GitHub Pages): an explicit server URL
//   (VITE_SERVER_URL) wins over both of the above.
// Kept free of import.meta.env so it can be exercised outside Vite.
type EndpointLocation = Pick<Location, "hostname" | "host" | "port" | "protocol" | "origin">;

export function normalizeServerUrl(value: string | undefined) {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export function isDevFrontend(location: EndpointLocation) {
  const host = location.hostname;
  return host === "localhost" || host === "127.0.0.1" || location.port === "5173" || location.port === "5174";
}

export function getServerHttpBase(location: EndpointLocation, serverUrl = "") {
  const configured = normalizeServerUrl(serverUrl);
  if (configured) {
    return configured;
  }

  if (isDevFrontend(location)) {
    return `http://${location.hostname}:8787`;
  }

  return location.origin;
}

export function getServerWebSocketUrl(query: string, location: EndpointLocation, serverUrl = "") {
  const configured = normalizeServerUrl(serverUrl);
  if (configured) {
    // https:// -> wss://, http:// -> ws://
    return `${configured.replace(/^http/i, "ws")}/ws${query}`;
  }

  if (isDevFrontend(location)) {
    return `ws://${location.hostname}:8787${query}`;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/ws${query}`;
}
