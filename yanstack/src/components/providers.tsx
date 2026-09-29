"use client";

import { ToastProvider } from "./toast";
import { FeedbackFab } from "./feedback-fab";
import { PresenceTracker } from "./presence-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <FeedbackFab />
      <PresenceTracker />
    </ToastProvider>
  );
}
