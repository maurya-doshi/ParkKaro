export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    count: number;
    total: number;
    nextToken: string | null;
    limit: number;
  };
}

export interface Dispute {
  disputeId: string;
  bookingId: string;
  raisedBy: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformReport {
  reportId: string;
  targetType: 'LISTING' | 'USER' | 'BOOKING' | 'MESSAGE';
  targetId: string;
  reason: string;
  description: string;
  reportedBy: string;
  status: 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
  createdAt: string;
}

export interface HostDashboardStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  upcomingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  recentBookings: Array<{
    bookingId: string;
    driverId: string;
    listingId: string;
    startTime: string;
    endTime: string;
    baseAmount: number;
    platformFee: number;
    totalAmount: number;
    hostEarnings?: number;
    bookingStatus: string;
    paymentStatus: string;
  }>;
  recentNotifications?: Array<any>;
}

export interface DriverDashboardStats {
  upcomingBookings: Array<{
    bookingId: string;
    listingId: string;
    startTime: string;
    endTime: string;
    baseAmount: number;
    platformFee: number;
    totalAmount: number;
    bookingStatus: string;
    qrVerificationCode?: string;
    qrData?: string;
    listingTitle?: string;
    listingAddress?: string;
    amount?: number;
  }>;
  activeBooking: {
    bookingId: string;
    listingId: string;
    startTime: string;
    endTime: string;
    baseAmount: number;
    platformFee: number;
    totalAmount: number;
    bookingStatus: string;
    qrVerificationCode?: string;
    qrData?: string;
    latitude?: number;
    longitude?: number;
    listingTitle?: string;
    listingAddress?: string;
    amount?: number;
  } | null;
  completedBookings: number;
  cancelledBookings: number;
  totalBookings: number;
  favoriteCount: number;
  vehicleCount: number;
  unreadNotifications: number;
  pastBookings?: Array<any>;
  recentBookings?: Array<any>;
  recentNotifications?: Array<any>;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalDrivers: number;
  totalHosts: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  totalRevenue: number;
  platformEarnings: number;
  averageRating: number;
  bookingsToday: number;
  revenueToday: number;
}
