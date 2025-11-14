import { create } from 'zustand';
import type { Field, Alert } from '../types';

interface AppState {
  selectedField: Field | null;
  setSelectedField: (field: Field | null) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  unreadAlertCount: number;
  setUnreadAlertCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedField: null,
  setSelectedField: (field) => set({ selectedField: field }),
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  unreadAlertCount: 0,
  setUnreadAlertCount: (count) => set({ unreadAlertCount: count }),
}));
