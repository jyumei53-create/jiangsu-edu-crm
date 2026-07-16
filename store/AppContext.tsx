import { createContext, useContext } from 'react';
import type { AppData } from '../types';

interface AppContextType {
  data: AppData;
  setData: (newData: AppData) => boolean;
  loading: boolean;
}

export const AppContext = createContext<AppContextType>({
  data: { version: 3, cities: [], updatedAt: '' },
  setData: () => false,
  loading: true,
});

export const useAppContext = () => useContext(AppContext);
