import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastNotificationTimes, setLastNotificationTimes] = useState<Record<string, number>>({});

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Cognitive energy notifications - DISABLED to prevent console errors
  // useEffect(() => {
  //   // Only connect to WebSocket if backend might be running
  //   // Check if we're in development and backend is likely available
  //   const isDevelopment = process.env.NODE_ENV === 'development';
  //   if (!isDevelopment) return;
  //   
  //   const ws = new WebSocket("ws://localhost:8000/ws/cognitive_energy");
  //   
  //   ws.onopen = () => {
  //     console.log("[WebSocket] Cognitive energy connected");
  //   };
  //   
  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       const energyLevel = data.energyLevel;
  //       const now = Date.now();
  //       const COOLDOWN = 2 * 60 * 1000; // 2 minutes in milliseconds

  //       if (energyLevel < 30) {
  //         const lastTime = lastNotificationTimes["low_energy"] || 0;
  //         if (now - lastTime > COOLDOWN) {
  //           addNotification({
  //             title: "Low Cognitive Energy",
  //             message: `Your cognitive energy is at ${energyLevel}%. Consider taking a break.`,
  //             type: "warning"
  //           });
  //           setLastNotificationTimes(prev => ({ ...prev, low_energy: now }));
  //         }
  //       } else if (energyLevel > 80) {
  //         const lastTime = lastNotificationTimes["high_load"] || 0;
  //         if (now - lastTime > COOLDOWN) {
  //           addNotification({
  //             title: "High Cognitive Load",
  //             message: `Your cognitive energy is at ${energyLevel}%. You're performing at peak capacity.`,
  //             type: "success"
  //           });
  //           setLastNotificationTimes(prev => ({ ...prev, high_load: now }));
  //         }
  //       }
  //     } catch (err) {
  //       // Silent fail for WebSocket errors
  //     }
  //   };
  //   
  //   ws.onerror = () => {
  //     // Silent fail - backend not running
  //   };
  //   
  //   ws.onclose = () => {
  //     // Silent fail
  //   };
  //   
  //   return () => {
  //     ws.close();
  //   };
  // }, [lastNotificationTimes, addNotification]);

  // Work balance notifications - DISABLED to prevent console errors
  // useEffect(() => {
  //   const isDevelopment = process.env.NODE_ENV === 'development';
  //   if (!isDevelopment) return;
  //   
  //   const ws = new WebSocket("ws://localhost:8000/ws/work_balance");
  //   
  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       const diff = Math.abs(data.deepWork - data.collaborative);
  //       const now = Date.now();
  //       const COOLDOWN = 2 * 60 * 1000;

  //       if (diff > 50) {
  //         const lastTime = lastNotificationTimes["work_imbalance"] || 0;
  //         if (now - lastTime > COOLDOWN) {
  //           addNotification({
  //             title: "Work Imbalance Detected",
  //             message: `Your work balance is significantly skewed. Consider adjusting your tasks.`,
  //             type: 'warning'
  //           });
  //           setLastNotificationTimes(prev => ({ ...prev, work_imbalance: now }));
  //         }
  //       }
  //     } catch (err) {
  //       // Silent fail for WebSocket errors
  //     }
  //   };
  //   
  //   // Silent error handling
  //   ws.onerror = () => {};
  //   ws.onclose = () => {};
  //   
  //   return () => {
  //     ws.close();
  //   };
  // }, [lastNotificationTimes, addNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearNotifications,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
