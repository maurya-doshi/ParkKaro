// src/context/BookingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type BookingTemp = {
  tempId: string;
  listingId: string;
  date: string;
  startTime: string;
  endTime: string;
  vehicleId?: string;
};

type BookingContextType = {
  booking?: BookingTemp;
  setBooking: (b: BookingTemp) => void;
  clearBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [booking, setBookingState] = useState<BookingTemp | undefined>(undefined);

  const setBooking = (b: BookingTemp) => setBookingState(b);
  const clearBooking = () => setBookingState(undefined);

  return (
    <BookingContext.Provider value={{ booking, setBooking, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
};
