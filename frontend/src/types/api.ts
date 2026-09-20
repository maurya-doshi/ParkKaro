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
  upcomingBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  occupancyRate: number;
  averageRating: number;
  recentBookings: Array<{
    bookingId: string;
    listingTitle: string;
    driverName: string;
    startTime: string;
    endTime: string;
    amount: number;
    status: string;
  }>;
}

export interface DriverDashboardStats {
  upcomingBookings: Array<{
    bookingId: string;
    listingId: string;
    listingTitle: string;
    listingAddress: string;
    startTime: string;
    endTime: string;
    amount: number;
    bookingStatus: string;
    qrVerificationCode: string;
  }>;
  pastBookings: Array<{
    bookingId: string;
    listingId: string;
    listingTitle: string;
    startTime: string;
    endTime: string;
    amount: number;
    bookingStatus: string;
  }>;
  activeBooking: {
    bookingId: string;
    listingId: string;
    listingTitle: string;
    listingAddress: string;
    startTime: string;
    endTime: string;
    amount: number;
    bookingStatus: string;
    qrVerificationCode: string;
    latitude: number;
    longitude: number;
  } | null;
  favoriteCount: number;
  vehicleCount: number;
  reviewCount: number;
  unreadNotifications: number;
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
