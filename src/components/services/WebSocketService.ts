import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "../../config";

let stompClient: Client | null = null;

export const connectWebSocket = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("No authToken found");
    return;
  }

  const socketUrl = `${API_BASE_URL}/app-data-service/ws?token=${token}`;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => {
      console.log("STOMP Debug:", str);
    },
  });

  stompClient.onConnect = () => {
    console.log("✅ WebSocket Connected");

    subscribeAllTopics();
  };

  stompClient.onDisconnect = () => {
    console.warn("⚠️ STOMP Disconnected");
  };

  stompClient.onWebSocketClose = () => {
    console.warn("⚠️ WebSocket closed");
  };

  stompClient.onStompError = (frame) => {
    console.error("🔥 STOMP Error:", frame.headers["message"], frame.body);
  };

  stompClient.activate();
};

const subscribeAllTopics = () => {
  if (!stompClient) return;

  stompClient.subscribe("/topic/check-in", (message: IMessage) => {
    console.log("Check-In Event:", JSON.parse(message.body));
  });

  stompClient.subscribe("/topic/check-out", (message: IMessage) => {
    console.log("Check-Out Event:", JSON.parse(message.body));
  });

  stompClient.subscribe("/topic/verify", (message: IMessage) => {
    console.log("Verify Conflict:", JSON.parse(message.body));
  });

  stompClient.subscribe("/topic/overdue", (message: IMessage) => {
    console.log("Overdue Ticket:", JSON.parse(message.body));
  });
};

export const disconnectWebSocket = () => {
  stompClient?.deactivate();
};
