import React from "react";
import { InAppNotification } from "../types";
import "../styles/notifications.css";

interface NotificationStackProps {
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationStack: React.FC<NotificationStackProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="notification-stack-container">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className="notification-banner-card"
          onClick={() => onDismiss(notif.id)}
          title="Click to dismiss this notification"
        >
          <div className="notif-icon-col">⭐</div>
          <div className="notif-text-col">
            <h4 className="notif-title">{notif.title}</h4>
            <p className="notif-message">{notif.message}</p>
            <span className="notif-dismiss-hint">Click card to dismiss</span>
          </div>
          <button 
            className="notif-close-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notif.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
