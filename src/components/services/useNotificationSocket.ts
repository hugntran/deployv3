import { useEffect } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "../../config";

interface NotificationData {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

export const useNotificationSocket = (onMessage: (notification: NotificationData) => void) => {
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const socket = new SockJS(`${API_BASE_URL}/app-data-service/ws?token=${token}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log("📡 STOMP Debug:", str),
    });

    stompClient.onConnect = () => {
      console.log("✅ WebSocket connected");

      const subscribe = (destination: string, label: string) => {
        stompClient.subscribe(destination, (message: IMessage) => {
          const data = JSON.parse(message.body);
          console.log(`🔔 ${label}:`, data);
          onMessage({ ...data, type: label });
        });
      };

      subscribe("/topic/check-in", "Check-In");
      subscribe("/topic/check-out", "Check-Out");
      subscribe("/topic/verify", "Verify Conflict");
      subscribe("/topic/overdue", "Overdue");
    };

    stompClient.onStompError = (frame) => {
      console.error("🔥 STOMP Error:", frame.headers["message"], frame.body);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [onMessage]);
};
