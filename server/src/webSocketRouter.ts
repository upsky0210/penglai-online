import type { IncomingMessage } from "node:http";
import { isClientMessage, type ClientMessage } from "@penglai/shared";
import type { WebSocket, WebSocketServer } from "ws";

export interface WebSocketRouterOptions<Connection> {
  server: WebSocketServer;
  connect: (socket: WebSocket, request: IncomingMessage) => Connection;
  route: (connection: Connection, socket: WebSocket, message: ClientMessage) => void;
  disconnect: (connection: Connection) => void;
  onInvalidMessage: () => void;
}

export function registerWebSocketRouter<Connection>(options: WebSocketRouterOptions<Connection>) {
  options.server.on("connection", (socket, request) => {
    socket.on("error", () => {
      // Oversized/malformed frames and abrupt network failures must not become
      // unhandled EventEmitter errors that terminate the classroom server.
      options.onInvalidMessage();
    });

    const connection = options.connect(socket, request);

    socket.on("message", (raw) => {
      let parsedMessage: unknown;
      try {
        parsedMessage = JSON.parse(raw.toString());
      } catch {
        options.onInvalidMessage();
        return;
      }

      if (!isClientMessage(parsedMessage)) {
        options.onInvalidMessage();
        return;
      }
      options.route(connection, socket, parsedMessage);
    });

    socket.on("close", () => {
      options.disconnect(connection);
    });
  });
}
