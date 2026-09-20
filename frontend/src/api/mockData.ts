import { ParkingListing } from '../types/parking';
import { Booking } from '../types/booking';
import { Vehicle } from '../types/vehicle';
import { Review } from '../types/review';
import { Conversation, ChatMessage, NotificationItem } from '../types/message';
import { User } from '../types/user';

export const DEMO_USERS: Record<string, User> = {
  driver: {
    userId: 'driver_demo_1',
    email: 'driver1@demo.parkshare.com',
    name: 'Arjun Verma',
    phone: '+91 98765 43210',
    role: 'DRIVER',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z'
  },
  host: {
    userId: 'host_demo_1',
    email: 'host1@demo.parkshare.com',
    name: 'Priya Sharma',
    phone: '+91 98123 45678',
    role: 'HOST',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    createdAt: '2025-11-20T09:30:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z'
  },
  admin: {
    userId: 'admin_demo_1',
    email: 'admin@demo.parkshare.com',
    name: 'Super Administrator',
    phone: '+91 99999 88888',
    role: 'ADMIN',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    status: 'ACTIVE',
    createdAt: '2025-10-01T00:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z'
  }
};

export const DEMO_VEHICLES: Vehicle[] = [
  {
    vehicleId: 'veh_01',
    userId: 'user_driver1',
    vehicleNumber: 'KA-01-MJ-4521',
    vehicleType: 'CAR',
    make: 'Hyundai',
    model: 'Creta SX (O)',
    color: 'Polar White',
    isDefault: true,
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z'
  },
  {
    vehicleId: 'veh_02',
    userId: 'user_driver1',
    vehicleNumber: 'KA-05-EV-9012',
    vehicleType: 'EV',
    make: 'Tata',
    model: 'Nexon EV Empowered',
    color: 'Daytona Grey',
    isDefault: false,
    createdAt: '2026-04-18T14:30:00.000Z',
    updatedAt: '2026-04-18T14:30:00.000Z'
  },
  {
    vehicleId: 'veh_03',
    userId: 'user_driver1',
    vehicleNumber: 'KA-03-HK-7890',
    vehicleType: 'BIKE',
    make: 'Royal Enfield',
    model: 'Hunter 350',
    color: 'Rebel Red',
    isDefault: false,
    createdAt: '2026-06-05T09:15:00.000Z',
    updatedAt: '2026-06-05T09:15:00.000Z'
  }
];

export const DEMO_LISTINGS: ParkingListing[] = [
  {
    listingId: 'listing_01',
    hostId: 'user_host1',
    title: 'Nexus Mall Proximity Covered Bay',
    description: 'Ultra-safe covered basement parking just 150m from Nexus Forum Mall Koramangala. 24/7 security guard, high-res CCTV surveillance, bright LED lighting, and direct elevator access.',
    address: '24, 7th Main Road, 4th Block, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    parkingType: 'BASEMENT',
    capacity: 4,
    vehicleTypes: ['CAR', 'SUV', 'EV'],
    pricePerHour: 45,
    pricePerDay: 400,
    monthlyPrice: 8500,
    amenities: ['covered', 'cctv', 'security', 'lighting', 'evCharging', 'accessible', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '06:00', close: '23:30' },
      tuesday: { open: '06:00', close: '23:30' },
      wednesday: { open: '06:00', close: '23:30' },
      thursday: { open: '06:00', close: '23:30' },
      friday: { open: '06:00', close: '23:59' },
      saturday: { open: '07:00', close: '23:59' },
      sunday: { open: '07:00', close: '23:00' }
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.9,
    reviewCount: 38,
    status: 'ACTIVE',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-09-18T10:00:00.000Z'
  },
  {
    listingId: 'listing_02',
    hostId: 'user_host1',
    title: 'Indiranagar 100ft Road Private Driveway',
    description: 'Gated, private residential driveway right off 100ft Road, walking distance to Toit and major retail flagship stores. Safe residential neighborhood with gatekeeper.',
    address: '884, 12th Main, HAL 2nd Stage, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    latitude: 12.9719,
    longitude: 77.6412,
    parkingType: 'GARAGE',
    capacity: 2,
    vehicleTypes: ['CAR', 'SUV'],
    pricePerHour: 55,
    pricePerDay: 500,
    monthlyPrice: 9900,
    amenities: ['covered', 'cctv', 'security', 'lighting', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '07:00', close: '23:00' },
      tuesday: { open: '07:00', close: '23:00' },
      wednesday: { open: '07:00', close: '23:00' },
      thursday: { open: '07:00', close: '23:00' },
      friday: { open: '07:00', close: '23:59' },
      saturday: { open: '08:00', close: '23:59' },
      sunday: { open: '08:00', close: '22:00' }
    },
    cancellationPolicy: 'MODERATE',
    rating: 4.8,
    reviewCount: 29,
    status: 'ACTIVE',
    createdAt: '2026-02-14T08:00:00.000Z',
    updatedAt: '2026-09-17T11:20:00.000Z'
  },
  {
    listingId: 'listing_03',
    hostId: 'user_host2',
    title: 'HSR Sector 1 Tech Corridor EV Hub',
    description: 'Dedicated high-speed Type 2 AC EV charger bay with wide turning radius. Covered porch parking ideal for startups and tech executives visiting 27th Main HSR.',
    address: '412, 19th Main, Sector 1, HSR Layout',
    area: 'HSR Layout',
    city: 'Bengaluru',
    latitude: 12.9121,
    longitude: 77.6446,
    parkingType: 'COVERED',
    capacity: 3,
    vehicleTypes: ['CAR', 'SUV', 'EV'],
    pricePerHour: 40,
    pricePerDay: 350,
    monthlyPrice: 7500,
    amenities: ['covered', 'evCharging', 'cctv', 'lighting', 'accessible'],
    photos: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '07:00', close: '21:00' },
      sunday: { open: '07:00', close: '21:00' }
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.7,
    reviewCount: 21,
    status: 'ACTIVE',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-09-15T09:00:00.000Z'
  },
  {
    listingId: 'listing_04',
    hostId: 'user_host3',
    title: 'MG Road Metro Station Premium Stash',
    description: 'Prime Central Bengaluru parking 3 mins walk from Trinity and MG Road Metro Stations. Perfect for CBD office workers, shoppers on Brigade Road, and weekend dinners.',
    address: '15, Craig Park Layout, Off MG Road',
    area: 'MG Road',
    city: 'Bengaluru',
    latitude: 12.9756,
    longitude: 77.6067,
    parkingType: 'COMMERCIAL',
    capacity: 6,
    vehicleTypes: ['CAR', 'SUV', 'BIKE', 'EV'],
    pricePerHour: 60,
    pricePerDay: 550,
    monthlyPrice: 11000,
    amenities: ['covered', 'cctv', 'security', 'lighting', 'accessible', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '05:30', close: '23:30' },
      tuesday: { open: '05:30', close: '23:30' },
      wednesday: { open: '05:30', close: '23:30' },
      thursday: { open: '05:30', close: '23:30' },
      friday: { open: '05:30', close: '23:59' },
      saturday: { open: '06:00', close: '23:59' },
      sunday: { open: '06:00', close: '23:00' }
    },
    cancellationPolicy: 'MODERATE',
    rating: 4.9,
    reviewCount: 54,
    status: 'ACTIVE',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-09-18T15:00:00.000Z'
  },
  {
    listingId: 'listing_05',
    hostId: 'user_host4',
    title: 'Whitefield ITPL Main Road Secure Deck',
    description: 'Spacious multistory parking slot opposite International Tech Park Bangalore (ITPL). Boom barrier access control, numbered bays, EV charging stations, and covered shade.',
    address: 'Near Pattandur Agrahara, ITPL Main Road, Whitefield',
    area: 'Whitefield',
    city: 'Bengaluru',
    latitude: 12.9863,
    longitude: 77.7382,
    parkingType: 'COVERED',
    capacity: 8,
    vehicleTypes: ['CAR', 'SUV', 'BIKE', 'EV'],
    pricePerHour: 35,
    pricePerDay: 280,
    monthlyPrice: 5800,
    amenities: ['covered', 'cctv', 'security', 'lighting', 'evCharging', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' }
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.6,
    reviewCount: 19,
    status: 'ACTIVE',
    createdAt: '2026-02-05T09:00:00.000Z',
    updatedAt: '2026-09-12T14:10:00.000Z'
  },
  {
    listingId: 'listing_06',
    hostId: 'user_host5',
    title: 'Electronic City Phase 1 Infosys Gate 1',
    description: 'Paved, fenced open lot with 24/7 security booth and high-mast floodlights. 100 meters from Infosys Gate 1 and Wipro. Very economical daily rates.',
    address: 'Electronics City Phase 1, Near Velankani Tech Park',
    area: 'Electronic City',
    city: 'Bengaluru',
    latitude: 12.8452,
    longitude: 77.6602,
    parkingType: 'OPEN',
    capacity: 10,
    vehicleTypes: ['CAR', 'SUV', 'BIKE', 'TRUCK'],
    pricePerHour: 30,
    pricePerDay: 220,
    monthlyPrice: 4800,
    amenities: ['cctv', 'security', 'lighting', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' }
    },
    cancellationPolicy: 'FLEXIBLE',
    rating: 4.5,
    reviewCount: 16,
    status: 'ACTIVE',
    createdAt: '2026-03-20T07:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  },
  {
    listingId: 'listing_07',
    hostId: 'user_host1',
    title: 'Marathahalli Outer Ring Road Junction Bay',
    description: 'Convenient spot right beside Innovative Multiplex and ORR skywalk. Ideal for commuters transiting toward Bellandur, Sarjapur, or Mahadevapura.',
    address: 'Near ORR Bridge, Marathahalli Village',
    area: 'Marathahalli',
    city: 'Bengaluru',
    latitude: 12.9569,
    longitude: 77.7011,
    parkingType: 'COVERED',
    capacity: 3,
    vehicleTypes: ['CAR', 'SUV', 'BIKE'],
    pricePerHour: 35,
    pricePerDay: 300,
    monthlyPrice: 6200,
    amenities: ['covered', 'cctv', 'lighting', '24x7'],
    photos: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80'
    ],
    availability: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '07:00', close: '22:00' },
      sunday: { open: '07:00', close: '22:00' }
    },
    cancellationPolicy: 'MODERATE',
    rating: 4.6,
    reviewCount: 14,
    status: 'ACTIVE',
    createdAt: '2026-04-02T11:00:00.000Z',
    updatedAt: '2026-09-16T18:00:00.000Z'
  }
];

export const DEMO_BOOKINGS: Booking[] = [
  {
    bookingId: 'booking_active101',
    listingId: 'listing_01',
    listingTitle: 'Nexus Mall Proximity Covered Bay',
    listingAddress: '24, 7th Main Road, 4th Block, Koramangala',
    listingArea: 'Koramangala',
    hostId: 'user_host1',
    hostName: 'Priya Sharma',
    driverId: 'user_driver1',
    driverName: 'Arjun Verma',
    vehicleId: 'veh_01',
    vehicleNumber: 'KA-01-MJ-4521',
    vehicleModel: 'Hyundai Creta',
    startTime: '2026-09-19T09:00:00.000Z',
    endTime: '2026-09-19T13:00:00.000Z',
    durationHours: 4,
    baseAmount: 180,
    platformFee: 18,
    tax: 0,
    totalAmount: 198,
    hostEarnings: 162,
    paymentStatus: 'PAID',
    bookingStatus: 'ACTIVE',
    qrData: 'PARKSHARE-AUTH:booking_active101:listing_01:user_driver1:ACTIVE',
    qrVerificationCode: 'PK-9942',
    createdAt: '2026-09-18T14:30:00.000Z',
    updatedAt: '2026-09-19T09:05:00.000Z'
  },
  {
    bookingId: 'booking_upcoming102',
    listingId: 'listing_02',
    listingTitle: 'Indiranagar 100ft Road Private Driveway',
    listingAddress: '884, 12th Main, HAL 2nd Stage, Indiranagar',
    listingArea: 'Indiranagar',
    hostId: 'user_host1',
    hostName: 'Priya Sharma',
    driverId: 'user_driver1',
    driverName: 'Arjun Verma',
    vehicleId: 'veh_02',
    vehicleNumber: 'KA-05-EV-9012',
    vehicleModel: 'Tata Nexon EV',
    startTime: '2026-09-20T11:00:00.000Z',
    endTime: '2026-09-20T15:00:00.000Z',
    durationHours: 4,
    baseAmount: 220,
    platformFee: 22,
    tax: 0,
    totalAmount: 242,
    hostEarnings: 198,
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    qrData: 'PARKSHARE-AUTH:booking_upcoming102:listing_02:user_driver1:CONFIRMED',
    qrVerificationCode: 'IN-4819',
    createdAt: '2026-09-18T16:00:00.000Z',
    updatedAt: '2026-09-18T16:00:00.000Z'
  },
  {
    bookingId: 'booking_past103',
    listingId: 'listing_04',
    listingTitle: 'MG Road Metro Station Premium Stash',
    listingAddress: '15, Craig Park Layout, Off MG Road',
    listingArea: 'MG Road',
    hostId: 'user_host3',
    hostName: 'Vikram Joshi',
    driverId: 'user_driver1',
    driverName: 'Arjun Verma',
    vehicleId: 'veh_01',
    vehicleNumber: 'KA-01-MJ-4521',
    vehicleModel: 'Hyundai Creta',
    startTime: '2026-09-15T14:00:00.000Z',
    endTime: '2026-09-15T17:00:00.000Z',
    durationHours: 3,
    baseAmount: 180,
    platformFee: 18,
    tax: 0,
    totalAmount: 198,
    hostEarnings: 162,
    paymentStatus: 'PAID',
    bookingStatus: 'COMPLETED',
    qrData: 'PARKSHARE-AUTH:booking_past103:listing_04:user_driver1:COMPLETED',
    qrVerificationCode: 'MG-1102',
    createdAt: '2026-09-14T19:20:00.000Z',
    updatedAt: '2026-09-15T17:05:00.000Z'
  }
];

export const DEMO_REVIEWS: Review[] = [
  {
    reviewId: 'rev_01',
    listingId: 'listing_01',
    bookingId: 'booking_past103',
    userId: 'user_driver1',
    userName: 'Arjun Verma',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    comment: 'Super easy parking experience right opposite the mall. Security guard was attentive and the QR scan was instantaneous!',
    createdAt: '2026-09-15T18:30:00.000Z'
  },
  {
    reviewId: 'rev_02',
    listingId: 'listing_01',
    bookingId: 'booking_prev99',
    userId: 'user_driver2',
    userName: 'Meera Nambiar',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    comment: 'Spacious bays with clear signs. Very safe basement even late at night.',
    createdAt: '2026-09-12T20:15:00.000Z'
  },
  {
    reviewId: 'rev_03',
    listingId: 'listing_02',
    bookingId: 'booking_prev88',
    userId: 'user_driver3',
    userName: 'Rohan Sen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    rating: 5,
    comment: 'Saved me 45 minutes circling 100ft road on a Saturday night. Host Priya was very hospitable.',
    createdAt: '2026-09-10T11:45:00.000Z'
  }
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'notif_01',
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed!',
    message: 'Your slot at Nexus Mall Proximity Covered Bay is booked for today.',
    data: { bookingId: 'booking_active101', listingId: 'listing_01' },
    read: false,
    createdAt: '2026-09-18T14:30:00.000Z'
  },
  {
    notificationId: 'notif_02',
    type: 'BOOKING_UPCOMING',
    title: 'Upcoming Reservation Tomorrow',
    message: 'Reminder: Reservation at Indiranagar 100ft Road begins tomorrow at 11:00 AM.',
    data: { bookingId: 'booking_upcoming102', listingId: 'listing_02' },
    read: false,
    createdAt: '2026-09-18T16:00:00.000Z'
  },
  {
    notificationId: 'notif_03',
    type: 'PAYMENT_UPDATE',
    title: 'Payment Successful (₹198)',
    message: 'Receipt issued for booking PK-9942. View details in your bookings page.',
    data: { bookingId: 'booking_active101' },
    read: true,
    createdAt: '2026-09-18T14:31:00.000Z'
  }
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    conversationId: 'conv_01',
    participants: ['user_driver1', 'user_host1'],
    participantNames: {
      user_driver1: 'Arjun Verma',
      user_host1: 'Priya Sharma'
    },
    listingId: 'listing_01',
    listingTitle: 'Nexus Mall Proximity Covered Bay',
    lastMessageAt: '2026-09-18T15:10:00.000Z',
    lastMessagePreview: 'Yes, the security booth will direct you to slot B-4!',
    unreadCount: 1,
    createdAt: '2026-09-18T14:45:00.000Z'
  }
];

export const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  conv_01: [
    {
      messageId: 'msg_01',
      conversationId: 'conv_01',
      senderId: 'user_driver1',
      senderName: 'Arjun Verma',
      content: 'Hello Priya, should I inform the security guard when entering the basement gate?',
      createdAt: '2026-09-18T14:50:00.000Z'
    },
    {
      messageId: 'msg_02',
      conversationId: 'conv_01',
      senderId: 'user_host1',
      senderName: 'Priya Sharma',
      content: 'Yes, just show the ParkShare QR code or say code PK-9942 and they will open the boom barrier immediately!',
      createdAt: '2026-09-18T15:05:00.000Z'
    },
    {
      messageId: 'msg_03',
      conversationId: 'conv_01',
      senderId: 'user_host1',
      senderName: 'Priya Sharma',
      content: 'Yes, the security booth will direct you to slot B-4!',
      createdAt: '2026-09-18T15:10:00.000Z'
    }
  ]
};

export const DEMO_FAVORITES: string[] = ['listing_01', 'listing_04'];
