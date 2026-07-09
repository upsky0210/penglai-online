import type { ClientMessage, ServerMessage } from "@penglai/shared";

interface GameSocketHandlers {
  onOpen?: () => void;
  onError?: () => void;
  onMessage: (message: ServerMessage) => void;
  onClose?: () => void;
}

export class GameSocket {
  private readonly ws: WebSocket;

  constructor(url: string, handlers: GameSocketHandlers) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener("open", () => handlers.onOpen?.());
    this.ws.addEventListener("error", () => handlers.onError?.());
    this.ws.addEventListener("message", (event) => {
      handlers.onMessage(JSON.parse(event.data.toString()) as ServerMessage);
    });
    this.ws.addEventListener("close", () => handlers.onClose?.());
  }

  get readyState() {
    return this.ws.readyState;
  }

  close() {
    this.ws.close();
  }

  send(message: ClientMessage) {
    this.ws.send(JSON.stringify(message));
  }
}

export function getGameSocketUrl(query: string, location: Location = window.location) {
  const host = location.hostname;
  if (isDevFrontend(location)) {
    return `ws://${host}:8787${query}`;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/ws${query}`;
}

function isDevFrontend(location: Location) {
  const host = location.hostname;
  return host === "localhost" || host === "127.0.0.1" || location.port === "5173" || location.port === "5174";
}
