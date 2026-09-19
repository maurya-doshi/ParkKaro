# ParkShare — API Contract

> **Owner:** Person 2 (Backend)  
> **Base URL:** `http://localhost:3001` (dev) | `https://api.parkshare.com` (prod)  
> **Last Updated:** 2026-09-18

---

## Table of Contents

1. [Authentication](#authentication)
2. [Standard Response Format](#standard-response-format)
3. [Parking Listings](#parking-listings)
4. [Search](#search)
5. [Availability](#availability)
6. [Bookings](#bookings)
7. [Vehicles](#vehicles)
8. [Favorites](#favorites)
9. [Reviews](#reviews)
10. [Payments](#payments)
11. [Host Earnings & Payouts](#host-earnings--payouts)
12. [Notifications](#notifications)
13. [Messaging](#messaging)
14. [Disputes](#disputes)
15. [Reports](#reports)
16. [Host Dashboard](#host-dashboard)
17. [Driver Dashboard](#driver-dashboard)
18. [Admin APIs](#admin-apis)
19. [AI Integration](#ai-integration)
20. [Error Codes](#error-codes)
21. [Status Enums](#status-enums)

---

## Authentication

### Demo Mode (Local Development)

Pass identity via headers:

```
X-Demo-User-Id: user_123
X-Demo-Email: driver@example.com
X-Demo-Name: John Driver
X-Demo-Role: DRIVER
```

### Production Mode (Cognito)

```
Authorization: Bearer <JWT_TOKEN>
```

### Roles

| Role | Description |
|------|-------------|
| `DRIVER` | Can search, book, review, manage vehicles |
| `HOST` | Can create/manage listings, view earnings |
| `ADMIN` | Full platform access |

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Success (Paginated)

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "count": 10,
      "total": 45,
      "nextToken": "eyJ...",
      "limit": 10
    }
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "Parking listing not found"
  }
}
```

---

## Parking Listings

### POST /parking

Create a new parking listing.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST, ADMIN |

**Request Body:**

```json
{
  "title": "Covered Parking Near Forum Mall",
  "description": "Secure covered parking space with CCTV and 24/7 security guard.",
  "address": "123, 4th Cross, 5th Block, Koramangala",
  "area": "Koramangala",
  "city": "Bengaluru",
  "latitude": 12.9352,
  "longitude": 77.6245,
  "parkingType": "COVERED",
  "capacity": 2,
  "vehicleTypes": ["CAR", "SUV"],
  "pricePerHour": 40,
  "pricePerDay": 350,
  "amenities": ["covered", "cctv", "security", "lighting"],
  "photos": [],
  "availability": {
    "monday": { "open": "06:00", "close": "23:00" },
    "tuesday": { "open": "06:00", "close": "23:00" },
    "wednesday": { "open": "06:00", "close": "23:00" },
    "thursday": { "open": "06:00", "close": "23:00" },
    "friday": { "open": "06:00", "close": "23:00" },
    "saturday": { "open": "08:00", "close": "22:00" },
    "sunday": { "open": "08:00", "close": "22:00" }
  },
  "cancellationPolicy": "MODERATE"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "listingId": "listing_abc123",
    "hostId": "user_host1",
    "title": "Covered Parking Near Forum Mall",
    "description": "Secure covered parking space with CCTV and 24/7 security guard.",
    "address": "123, 4th Cross, 5th Block, Koramangala",
    "area": "Koramangala",
    "city": "Bengaluru",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "parkingType": "COVERED",
    "capacity": 2,
    "vehicleTypes": ["CAR", "SUV"],
    "pricePerHour": 40,
    "pricePerDay": 350,
    "amenities": ["covered", "cctv", "security", "lighting"],
    "photos": [],
    "availability": { ... },
    "cancellationPolicy": "MODERATE",
    "rating": 0,
    "reviewCount": 0,
    "status": "ACTIVE",
    "createdAt": "2026-09-18T10:00:00.000Z",
    "updatedAt": "2026-09-18T10:00:00.000Z"
  }
}
```

---

### GET /parking

List/search parking listings.

| Field | Value |
|-------|-------|
| **Auth** | Optional |
| **Role** | Any |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| area | string | Filter by area |
| city | string | Filter by city |
| lat | number | Latitude for distance search |
| lng | number | Longitude for distance search |
| radius | number | Radius in km (default: 5) |
| date | string | Date (YYYY-MM-DD) |
| startTime | string | Start time (HH:mm) |
| endTime | string | End time (HH:mm) |
| minPrice | number | Minimum hourly price |
| maxPrice | number | Maximum hourly price |
| parkingType | string | Parking type filter |
| vehicleType | string | Vehicle type filter |
| amenities | string | Comma-separated amenities |
| rating | number | Minimum rating |
| sortBy | string | `price`, `rating`, `distance` |
| limit | number | Results per page (default: 20) |
| nextToken | string | Pagination token |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "listingId": "listing_abc123",
        "title": "Covered Parking Near Forum Mall",
        "area": "Koramangala",
        "city": "Bengaluru",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "parkingType": "COVERED",
        "pricePerHour": 40,
        "amenities": ["covered", "cctv", "security"],
        "rating": 4.5,
        "reviewCount": 12,
        "photos": ["https://..."],
        "distance": 1.2
      }
    ],
    "pagination": {
      "count": 10,
      "nextToken": null,
      "limit": 20
    }
  }
}
```

---

### GET /parking/{id}

Get a single listing by ID.

| Field | Value |
|-------|-------|
| **Auth** | Optional |
| **Role** | Any |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "listingId": "listing_abc123",
    "hostId": "user_host1",
    "title": "Covered Parking Near Forum Mall",
    "description": "Secure covered parking space...",
    "address": "123, 4th Cross, 5th Block, Koramangala",
    "area": "Koramangala",
    "city": "Bengaluru",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "parkingType": "COVERED",
    "capacity": 2,
    "vehicleTypes": ["CAR", "SUV"],
    "pricePerHour": 40,
    "pricePerDay": 350,
    "amenities": ["covered", "cctv", "security", "lighting"],
    "photos": [],
    "availability": { ... },
    "cancellationPolicy": "MODERATE",
    "rating": 4.5,
    "reviewCount": 12,
    "status": "ACTIVE",
    "createdAt": "2026-09-18T10:00:00.000Z",
    "updatedAt": "2026-09-18T10:00:00.000Z"
  }
}
```

**Error (404):**

```json
{
  "success": false,
  "error": {
    "code": "PARKING_LISTING_NOT_FOUND",
    "message": "Parking listing 'listing_xyz' not found"
  }
}
```

---

### PUT /parking/{id}

Update a listing. Only the host who owns the listing (or admin) can update.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST (own listing), ADMIN |

**Request Body:** Same fields as POST (all optional, only provided fields are updated).

**Response (200):** Updated listing object.

---

### DELETE /parking/{id}

Soft-delete a listing (sets status to DELETED).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST (own listing), ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Listing deleted successfully" }
}
```

---

### PATCH /parking/{id}/status

Update listing status.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST (own listing), ADMIN |

**Request Body:**

```json
{
  "status": "INACTIVE"
}
```

**Valid statuses:** `ACTIVE`, `INACTIVE`, `SUSPENDED` (admin only)

**Response (200):** Updated listing object.

---

## Search

Search is handled by `GET /parking` with query parameters (see above).

### Distance Calculation

When `lat` and `lng` are provided, results include a `distance` field (km) calculated using the Haversine formula. Results are filtered by `radius` (default 5km).

---

## Availability

### GET /parking/{id}/availability

Check availability for a listing on a given date/time range.

| Field | Value |
|-------|-------|
| **Auth** | Optional |
| **Role** | Any |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Date (YYYY-MM-DD) |
| startTime | string | No | Start time (HH:mm) |
| endTime | string | No | End time (HH:mm) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "listingId": "listing_abc123",
    "date": "2026-09-20",
    "capacity": 2,
    "operatingHours": { "open": "06:00", "close": "23:00" },
    "slots": [
      { "time": "06:00", "available": 2 },
      { "time": "06:30", "available": 2 },
      { "time": "07:00", "available": 2 },
      { "time": "10:00", "available": 1 },
      { "time": "10:30", "available": 1 },
      { "time": "11:00", "available": 1 },
      { "time": "11:30", "available": 1 },
      { "time": "12:00", "available": 2 }
    ],
    "requestedRange": {
      "startTime": "10:00",
      "endTime": "12:00",
      "isAvailable": true,
      "availableSpaces": 1
    },
    "priceEstimate": {
      "baseAmount": 80,
      "platformFee": 8,
      "tax": 0,
      "totalAmount": 88,
      "durationHours": 2,
      "ratePerHour": 40
    }
  }
}
```

### Boundary Rule

Time ranges use **half-open intervals** `[start, end)`. This means:
- Booking `10:00–12:00` occupies slots at 10:00, 10:30, 11:00, 11:30
- Booking `12:00–14:00` occupies slots at 12:00, 12:30, 13:00, 13:30
- These two bookings do **NOT** conflict (abutting times are allowed)

---

## Bookings

### POST /bookings

Create a new booking.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Request Body:**

```json
{
  "listingId": "listing_abc123",
  "vehicleId": "vehicle_xyz",
  "date": "2026-09-20",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_def456",
    "listingId": "listing_abc123",
    "hostId": "user_host1",
    "driverId": "user_driver1",
    "vehicleId": "vehicle_xyz",
    "startTime": "2026-09-20T10:00:00.000Z",
    "endTime": "2026-09-20T12:00:00.000Z",
    "durationHours": 2,
    "baseAmount": 80,
    "platformFee": 8,
    "tax": 0,
    "totalAmount": 88,
    "hostEarnings": 72,
    "paymentStatus": "PENDING",
    "bookingStatus": "CONFIRMED",
    "qrData": "eyJib29ra...",
    "qrVerificationCode": "A1B2C3D4",
    "createdAt": "2026-09-18T10:00:00.000Z",
    "updatedAt": "2026-09-18T10:00:00.000Z"
  }
}
```

**Error (409 — Double Booking):**

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "The requested time slot is no longer available"
  }
}
```

---

### GET /bookings

List authenticated user's bookings.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, HOST |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by booking status |
| limit | number | Results per page |
| nextToken | string | Pagination token |

**Response (200):** Paginated list of bookings.

---

### GET /bookings/{id}

Get a specific booking. Only the driver, host, or admin can view.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), HOST (own), ADMIN |

**Response (200):** Full booking object.

---

### POST /bookings/{id}/cancel

Cancel a booking.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), HOST (own), ADMIN |

**Request Body:**

```json
{
  "reason": "Plans changed"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_def456",
    "bookingStatus": "CANCELLED",
    "paymentStatus": "REFUNDED",
    "cancellationReason": "Plans changed",
    "cancelledBy": "user_driver1",
    "cancelledAt": "2026-09-18T11:00:00.000Z",
    "refundAmount": 88
  }
}
```

---

### POST /bookings/{id}/complete

Mark a booking as completed.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST (own booking), ADMIN |

**Response (200):** Updated booking with `bookingStatus: "COMPLETED"`.

---

## Vehicles

> **Implemented:** Commit 8

### POST /vehicles

Create a vehicle for the authenticated driver. The first vehicle is automatically set as default.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Request Body:**

```json
{
  "vehicleNumber": "KA-01-AB-1234",
  "vehicleType": "CAR",
  "make": "Hyundai",
  "model": "Creta",
  "color": "White",
  "isDefault": false
}
```

**Valid `vehicleType` values:** `CAR`, `BIKE`, `SUV`, `TRUCK`, `EV`

**Response (201):**

```json
{
  "success": true,
  "data": {
    "vehicleId": "vehicle_abc123456",
    "userId": "user_driver1",
    "vehicleNumber": "KA-01-AB-1234",
    "vehicleType": "CAR",
    "make": "Hyundai",
    "model": "Creta",
    "color": "White",
    "isDefault": true,
    "createdAt": "2026-09-19T00:00:00.000Z",
    "updatedAt": "2026-09-19T00:00:00.000Z"
  }
}
```

---

### GET /vehicles

List all vehicles belonging to the authenticated user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "vehicleId": "vehicle_abc123456",
        "userId": "user_driver1",
        "vehicleNumber": "KA-01-AB-1234",
        "vehicleType": "CAR",
        "make": "Hyundai",
        "model": "Creta",
        "color": "White",
        "isDefault": true,
        "createdAt": "2026-09-19T00:00:00.000Z",
        "updatedAt": "2026-09-19T00:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /vehicles/{id}

Get a vehicle by ID. Only the owner or ADMIN can access.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), ADMIN |

**Response (200):** Vehicle object.

**Error (403):** When requesting another user's vehicle.

**Error (404):** When vehicle does not exist.

---

### PUT /vehicles/{id}

Update a vehicle. Only the owner or ADMIN can update. Setting `isDefault: true` clears other defaults.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), ADMIN |

**Request Body:** All fields optional.

```json
{
  "vehicleNumber": "KA-01-CD-5678",
  "vehicleType": "SUV",
  "make": "Toyota",
  "model": "Fortuner",
  "color": "Black",
  "isDefault": true
}
```

**Response (200):** Updated vehicle object.

---

### DELETE /vehicles/{id}

Delete a vehicle. Only the owner or ADMIN can delete.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), ADMIN |

**Response (200):**

```json
{ "success": true, "data": { "message": "Vehicle deleted" } }
```

---

## Favorites

> **Implemented:** Commit 8

### POST /favorites/{parkingId}

Add a parking listing to the user's favorites. Returns 404 if the listing does not exist. Returns 409 if already favorited.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (201):**

```json
{
  "success": true,
  "data": { "listingId": "listing_abc123", "message": "Added to favorites" }
}
```

**Error (404):** Listing not found.

**Error (409):** Already in favorites.

---

### DELETE /favorites/{parkingId}

Remove a listing from favorites. Returns 404 if it was not favorited.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Removed from favorites" }
}
```

---

### GET /favorites

List user's favorites enriched with listing details.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "listingId": "listing_abc123",
        "title": "Covered Parking Near Forum Mall",
        "area": "Koramangala",
        "city": "Bengaluru",
        "pricePerHour": 40,
        "rating": 4.5,
        "photos": [],
        "addedAt": "2026-09-18T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /favorites/{parkingId}/check

Check whether a specific listing is in the user's favorites.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "listingId": "listing_abc123",
    "isFavorite": true
  }
}
```

---

## Reviews

> **Implemented:** Commit 8

### POST /reviews

Create a review for a parking listing. The reviewer must be the driver of a **completed** booking for that listing. One review allowed per booking.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Request Body:**

```json
{
  "listingId": "listing_abc123",
  "bookingId": "booking_def456",
  "rating": 4,
  "comment": "Good parking spot, well maintained."
}
```

**Validation rules:**
- `rating`: Integer between 1 and 5 (inclusive)
- `comment`: 1–1000 characters
- `bookingId` must reference a `COMPLETED` booking made by the caller
- `listingId` must match the booking's `listingId`
- One review per booking (duplicate blocked with 409)

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reviewId": "review_ghi789",
    "listingId": "listing_abc123",
    "bookingId": "booking_def456",
    "userId": "user_driver1",
    "rating": 4,
    "comment": "Good parking spot, well maintained.",
    "createdAt": "2026-09-18T15:00:00.000Z"
  }
}
```

**Error (400):** Booking not completed, listing mismatch, or invalid rating/comment.

**Error (403):** Caller is not the driver who made the booking.

**Error (404):** Booking does not exist.

**Error (409 — Duplicate):**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "You have already reviewed this booking"
  }
}
```

---

### GET /reviews/listing/{listingId}

Get paginated reviews for a listing, sorted by newest first.

| Field | Value |
|-------|-------|
| **Auth** | Optional |
| **Role** | Any |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max results (default: 50) |

**Response (200):** Paginated list of reviews.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "reviewId": "review_ghi789",
        "listingId": "listing_abc123",
        "bookingId": "booking_def456",
        "userId": "user_driver1",
        "rating": 4,
        "comment": "Good parking spot, well maintained.",
        "createdAt": "2026-09-18T15:00:00.000Z"
      }
    ],
    "pagination": { "count": 1, "limit": 50, "nextToken": null }
  }
}
```

---

### GET /reviews/me

Get the authenticated user's own reviews.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Response (200):**

```json
{
  "success": true,
  "data": { "items": [ ... ] }
}
```

---

### GET /reviews/{id}

Get a specific review by ID.

| Field | Value |
|-------|-------|
| **Auth** | Optional |
| **Role** | Any |

**Response (200):** Review object.

**Error (404):** Review not found.

---

## Payments

### POST /payments/create

Create a payment record for a booking.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Request Body:**

```json
{
  "bookingId": "booking_def456",
  "amount": 88,
  "currency": "INR"
}
```

**Response (201):** Payment object with status `PENDING`.

---

### POST /payments/{id}/confirm

Confirm/complete a payment (backend-controlled state transition).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Request Body:**

```json
{
  "providerRef": "mock_txn_12345"
}
```

**Response (200):** Payment object with status `PAID`.

---

### GET /payments/{id}

Get payment details.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER (own), HOST (related), ADMIN |

**Response (200):** Payment object.

---

## Host Earnings & Payouts

### GET /host/earnings

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST |

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| period | string | `today`, `week`, `month`, `all` (default: `month`) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "grossRevenue": 15000,
    "platformCommission": 1500,
    "netEarnings": 13500,
    "totalBookings": 45,
    "period": "month",
    "breakdown": [
      {
        "date": "2026-09-18",
        "bookings": 3,
        "gross": 480,
        "commission": 48,
        "net": 432
      }
    ]
  }
}
```

---

### GET /host/payouts

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST |

**Response (200):** Paginated list of payout records.

---

## Notifications

### GET /notifications

List notifications for the authenticated user (newest first).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |
| **Query Params** | `limit` (number, default: 50) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "user_driver1",
        "notificationId": "2026-09-18T10:00:00.000Z#notif_123",
        "type": "BOOKING_CONFIRMED",
        "title": "Booking Confirmed!",
        "message": "Your parking reservation at Covered Parking Near Forum Mall is confirmed.",
        "data": { "bookingId": "booking_def456", "listingId": "listing_abc123" },
        "read": false,
        "createdAt": "2026-09-18T10:00:00.000Z"
      }
    ],
    "pagination": {
      "count": 1,
      "limit": 50,
      "nextToken": null
    }
  }
}
```

---

### GET /notifications/unread-count

Get count of unread notifications for the user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

---

### PATCH /notifications/{id}/read (or POST /notifications/{id}/read)

Mark a single notification as read. Caller must be the notification recipient.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Notification recipient |
| **URL Parameter** | `id`: URL-encoded notificationId (e.g. `2026-09-18T10%3A00%3A00.000Z%23notif_123`) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Notification marked as read"
  }
}
```

**Errors:**
- `404 NOT_FOUND` — Notification not found or does not belong to user.

---

### PATCH /notifications/read-all

Mark all notifications as read for the authenticated user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "All notifications marked as read"
  }
}
```

---

## Messaging

### POST /conversations

Get or create a conversation between the authenticated user and another user. Idempotent: if a conversation already exists between the two users, returns the existing record.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Request Body:**

```json
{
  "otherUserId": "user_host1",
  "listingId": "listing_abc123",
  "bookingId": "booking_def456"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123456789012",
    "participants": ["user_driver1", "user_host1"],
    "participant1": "user_driver1",
    "participant2": "user_host1",
    "listingId": "listing_abc123",
    "bookingId": "booking_def456",
    "lastMessageAt": "2026-09-19T00:00:00.000Z",
    "lastMessagePreview": "",
    "createdAt": "2026-09-19T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Starting conversation with oneself (`otherUserId === userId`).

---

### GET /conversations

List all conversations for the authenticated user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "conversationId": "conv_123456789012",
        "participants": ["user_driver1", "user_host1"],
        "listingId": "listing_abc123",
        "lastMessageAt": "2026-09-19T00:05:00.000Z",
        "lastMessagePreview": "Is the parking spot available tomorrow?",
        "createdAt": "2026-09-19T00:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /conversations/{id}

Get a conversation by ID. User must be one of the participants.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Participant only |

**Response (200):** Conversation object.

**Errors:**
- `403 FORBIDDEN` — User is not a participant in the conversation.
- `404 NOT_FOUND` — Conversation not found.

---

### GET /conversations/{id}/messages

Get message history for a conversation (chronological order).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Participant only |
| **Query Params** | `limit` (number, default: 100) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "conversationId": "conv_123456789012",
        "messageId": "2026-09-19T00:05:00.000Z#uuid",
        "senderId": "user_driver1",
        "content": "Is the parking spot available tomorrow?",
        "createdAt": "2026-09-19T00:05:00.000Z"
      }
    ]
  }
}
```

**Errors:**
- `403 FORBIDDEN` — Non-participant access blocked.
- `404 NOT_FOUND` — Conversation does not exist.

---

### POST /conversations/{id}/messages

Send a message within an existing conversation. Updates the conversation's preview and timestamp, and generates a real-time `NEW_MESSAGE` notification for the other participant.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Participant only |

**Request Body:**

```json
{
  "content": "Yes, the spot is reserved and ready for your arrival."
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123456789012",
    "messageId": "2026-09-19T00:06:00.000Z#uuid",
    "senderId": "user_host1",
    "content": "Yes, the spot is reserved and ready for your arrival.",
    "createdAt": "2026-09-19T00:06:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Empty content or exceeds 2000 characters.
- `403 FORBIDDEN` — Non-participant cannot send messages.
- `404 NOT_FOUND` — Conversation not found.

---

## Disputes

### POST /disputes

Raise a dispute for a booking. Caller must be the driver or host of the booking. Booking cannot be in `CANCELLED` status. Prevents duplicate active disputes on the same booking. Automatically sends a `DISPUTE_UPDATE` notification to the other party.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Booking Driver or Host |

**Request Body:**

```json
{
  "bookingId": "booking_def456",
  "reason": "Slot was occupied by another vehicle",
  "description": "Upon arrival at 10:00 AM, another vehicle was parked in the reserved space.",
  "evidence": ["https://s3.amazonaws.com/parkshare/evidence1.jpg"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "disputeId": "dispute_123456789012",
    "bookingId": "booking_def456",
    "reportedBy": "user_driver1",
    "reason": "Slot was occupied by another vehicle",
    "description": "Upon arrival at 10:00 AM, another vehicle was parked in the reserved space.",
    "evidence": ["https://s3.amazonaws.com/parkshare/evidence1.jpg"],
    "status": "OPEN",
    "createdAt": "2026-09-19T10:15:00.000Z",
    "updatedAt": "2026-09-19T10:15:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — Cancelled booking or an active dispute already exists.
- `403 FORBIDDEN` — User is neither driver nor host of the booking.
- `404 NOT_FOUND` — Booking does not exist.

---

### GET /disputes

List disputes submitted by the authenticated user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [ ... ]
  }
}
```

---

### GET /disputes/{id}

Get dispute details. Caller must be the reporter, the booking driver/host, or an ADMIN.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Booking party or ADMIN |

**Response (200):** Dispute object.

**Errors:**
- `403 FORBIDDEN` — Unauthorized viewer.
- `404 NOT_FOUND` — Dispute not found.

---

### PATCH /disputes/{id}

Update dispute status or provide resolution. Only administrators can transition to `RESOLVED` or `DISMISSED`. Automatically sends a `DISPUTE_UPDATE` notification to the dispute reporter.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN (for RESOLVED/DISMISSED) |

**Request Body:**

```json
{
  "status": "RESOLVED",
  "resolution": "Full refund of ₹88 issued to driver."
}
```

**Response (200):** Updated Dispute object.

**Errors:**
- `400 VALIDATION_ERROR` — Invalid status transition (e.g. from RESOLVED to OPEN).
- `403 FORBIDDEN` — Non-admin attempting to resolve/dismiss.
- `404 NOT_FOUND` — Dispute not found.

---

## Reports

### POST /reports

Submit a report regarding a listing, user, booking, or message.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any |

**Request Body:**

```json
{
  "targetType": "LISTING",
  "targetId": "listing_abc123",
  "reason": "Misleading photos",
  "description": "The photos do not match the physical location."
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "reportId": "report_123456789012",
    "reportedBy": "user_driver1",
    "targetType": "LISTING",
    "targetId": "listing_abc123",
    "reason": "Misleading photos",
    "description": "The photos do not match the physical location.",
    "status": "PENDING",
    "createdAt": "2026-09-19T10:30:00.000Z",
    "updatedAt": "2026-09-19T10:30:00.000Z"
  }
}
```

---

### GET /reports (and GET /reports/me)

List reports. Standard users see their own submitted reports (`/reports/me`); administrators calling `/reports` or `/reports/all` can view all system reports.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any (own reports), ADMIN (all reports) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [ ... ]
  }
}
```

---

### GET /reports/all (Admin)

Admin endpoint to list all reports across the platform with optional status filter.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `status` (`PENDING`, `REVIEWED`, `ACTIONED`, `DISMISSED`) |

**Response (200):** `{ success: true, data: { items: [ ... ] } }`

---

### GET /reports/{id}

Get report details. Accessible by the reporter or an ADMIN.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Reporter or ADMIN |

**Response (200):** Report object.

**Errors:**
- `403 FORBIDDEN` — Non-reporter, non-admin.
- `404 NOT_FOUND` — Report not found.

---

### PATCH /reports/{id}/status (Admin)

Update the review status of a report.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Request Body:**

```json
{
  "status": "ACTIONED"
}
```

**Response (200):** Updated Report object.

**Errors:**
- `403 FORBIDDEN` — Non-admin attempt.
- `404 NOT_FOUND` — Report not found.

---

## Host Dashboard

### GET /host/dashboard

Authenticated host dashboard aggregating listings, bookings, earnings, rating, and recent activity. Strictly scoped to the authenticated host.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalListings": 3,
    "activeListings": 2,
    "totalBookings": 45,
    "upcomingBookings": 5,
    "activeBookings": 1,
    "completedBookings": 36,
    "cancelledBookings": 3,
    "totalEarnings": 45000,
    "pendingEarnings": 8500,
    "averageRating": 4.8,
    "recentBookings": [
      {
        "bookingId": "booking_def456",
        "listingId": "listing_abc123",
        "hostId": "host_1",
        "driverId": "driver_1",
        "vehicleId": "vehicle_1",
        "startTime": "2026-09-20T10:00:00.000Z",
        "endTime": "2026-09-20T12:00:00.000Z",
        "totalAmount": 88,
        "hostEarnings": 72,
        "bookingStatus": "CONFIRMED"
      }
    ],
    "recentNotifications": [ ... ]
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` — Missing or invalid authentication.
- `403 FORBIDDEN` — User is not a host or administrator.

---

### GET /host/listings-summary

Listing-level performance summary for all properties owned by the authenticated host.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "listingId": "listing_abc123",
        "title": "Covered Parking Near Forum Mall",
        "status": "ACTIVE",
        "capacity": 2,
        "pricePerHour": 40,
        "bookingCount": 24,
        "earnings": 19200,
        "rating": 4.8,
        "reviewCount": 18
      }
    ]
  }
}
```

---

### GET /host/earnings

Detailed host earnings analytics with period filtering, gross/net calculations, and periodic breakdown.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST, ADMIN |
| **Query Params** | `period`: `7d`, `30d`, `90d`, `12m`, `today`, `week`, `month`, `all` (default: `30d`) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "grossRevenue": 15000,
    "platformFees": 1500,
    "netEarnings": 13500,
    "totalBookings": 45,
    "completedBookings": 42,
    "averageBookingValue": 300,
    "breakdown": [
      {
        "date": "2026-09-18",
        "bookings": 3,
        "gross": 480,
        "fees": 48,
        "net": 432
      }
    ]
  }
}
```

---

## Driver Dashboard

### GET /driver/dashboard

Authenticated driver dashboard aggregating upcoming reservations, active session, saved items, and unread notification count.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "upcomingBookings": [
      {
        "bookingId": "booking_123",
        "listingId": "listing_abc123",
        "startTime": "2026-09-25T10:00:00.000Z",
        "endTime": "2026-09-25T12:00:00.000Z",
        "totalAmount": 110,
        "bookingStatus": "CONFIRMED"
      }
    ],
    "activeBooking": null,
    "completedBookings": 12,
    "cancelledBookings": 1,
    "totalBookings": 14,
    "favoriteCount": 5,
    "vehicleCount": 2,
    "unreadNotifications": 3,
    "recentBookings": [ ... ],
    "recentNotifications": [ ... ]
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` — Missing or invalid authentication.
- `403 FORBIDDEN` — User is not a driver or administrator.

---

## Admin APIs

All admin endpoints require `ADMIN` role. Role is strictly verified server-side from the authenticated identity.

### GET /admin/dashboard & GET /admin/analytics

Platform-wide analytics and real-time operational statistics.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalDrivers": 120,
    "totalHosts": 30,
    "totalListings": 50,
    "activeListings": 42,
    "totalBookings": 350,
    "completedBookings": 310,
    "cancelledBookings": 25,
    "activeBookings": 5,
    "upcomingBookings": 10,
    "totalRevenue": 125000,
    "platformEarnings": 12500,
    "totalHostPayouts": 98000,
    "pendingDisputes": 2,
    "openReports": 1,
    "averageRating": 4.5,
    "bookingsToday": 8,
    "revenueToday": 2400
  }
}
```

---

### GET /admin/activity

Recent platform activity feed across bookings, users, listings, disputes, reports, and payments.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `limit` (number, default: 10) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recentBookings": [ ... ],
    "recentUsers": [ ... ],
    "recentListings": [ ... ],
    "recentDisputes": [ ... ],
    "recentReports": [ ... ],
    "recentPayments": [ ... ]
  }
}
```

---

### GET /admin/users

List platform users with optional role and status filters.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `role` (`DRIVER`, `HOST`, `ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `DELETED`), `limit` |

**Response (200):** `{ "success": true, "data": { "items": [ ... ] } }`

---

### GET /admin/users/{id}

Retrieve full profile details for a user.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Response (200):** User object.

---

### PATCH /admin/users/{id}/status

Update user status (e.g. suspend or reactivate an account).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Response (200):** Updated User object.

---

### GET /admin/listings

List platform listings with optional status and area filters.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`), `area`, `limit` |

**Response (200):** `{ "success": true, "data": { "items": [ ... ] } }`

---

### GET /admin/listings/{id}

Get full listing details for administrative inspection.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Response (200):** ParkingListing object.

---

### PATCH /admin/listings/{id}/status

Update listing moderation status (e.g. suspend a flagged listing).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Response (200):** Updated ParkingListing object.

---

### GET /admin/bookings

List platform bookings with operational filters.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `status` (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `DISPUTED`), `driverId`, `hostId`, `listingId`, `limit` |

**Response (200):** `{ "success": true, "data": { "items": [ ... ] } }`

---

### GET /admin/disputes

List all platform disputes for administrative review.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`), `limit` |

**Response (200):** `{ "success": true, "data": { "items": [ ... ] } }`

---

### GET /admin/reports

List all platform reports for content moderation.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |
| **Query Params** | `status` (`PENDING`, `REVIEWED`, `ACTIONED`, `DISMISSED`), `limit` |

**Response (200):** `{ "success": true, "data": { "items": [ ... ] } }`

---

## AI Integration

> **Important:** AI endpoints provide integration points for Person 4 (Bedrock). The backend validates all requests and returns **real data**. AI can only recommend listing IDs that the backend returned. AI cannot create bookings, override availability, change prices, or create fake listings.

### POST /ai/search

AI-assisted search. Backend extracts structured filters and performs the actual DynamoDB query.

**Request Body:**

```json
{
  "query": "Find covered parking near Koramangala tomorrow from 10 AM to 2 PM under ₹100",
  "filters": {
    "location": "Koramangala",
    "date": "2026-09-19",
    "startTime": "10:00",
    "endTime": "14:00",
    "parkingType": "COVERED",
    "maxBudget": 100
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "listings": [ ... ],
    "searchContext": {
      "area": "Koramangala",
      "date": "2026-09-19",
      "startTime": "10:00",
      "endTime": "14:00",
      "resultsCount": 5,
      "filtersApplied": { "parkingType": "COVERED", "maxPrice": 100 }
    }
  }
}
```

---

### POST /ai/recommend

Get AI-powered recommendations based on user history.

**Request Body:**

```json
{
  "userId": "user_driver1",
  "context": "commute_parking"
}
```

**Response:** List of recommended listing IDs with real listing data.

---

### POST /ai/pricing

Get pricing context for AI-powered pricing suggestions.

**Request Body:**

```json
{
  "listingId": "listing_abc123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "listing": { ... },
    "comparables": [ ... ],
    "areaAveragePrice": 45,
    "bookingDemand": "HIGH",
    "suggestion": "ESTIMATE"
  }
}
```

> ⚠️ The `suggestion` field is always `ESTIMATE`. AI pricing is a suggestion, not an authoritative price.

---

### POST /ai/listing-description

Generate listing description context.

**Request Body:**

```json
{
  "area": "Koramangala",
  "parkingType": "COVERED",
  "amenities": ["cctv", "security", "covered"],
  "pricePerHour": 40
}
```

**Response:** Context data for AI to generate a description.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for this action |
| `PARKING_LISTING_NOT_FOUND` | 404 | Listing not found |
| `BOOKING_NOT_FOUND` | 404 | Booking not found |
| `VEHICLE_NOT_FOUND` | 404 | Vehicle not found |
| `REVIEW_NOT_FOUND` | 404 | Review not found |
| `BOOKING_CONFLICT` | 409 | Time slot unavailable |
| `CONFLICT` | 409 | Duplicate action |
| `PAYMENT_ERROR` | 402 | Payment failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Status Enums

### Booking Status

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting confirmation |
| `CONFIRMED` | Confirmed, upcoming |
| `ACTIVE` | Currently in use |
| `COMPLETED` | Finished |
| `CANCELLED` | Cancelled |
| `DISPUTED` | Under dispute |

**Valid transitions:**
```
PENDING → CONFIRMED → ACTIVE → COMPLETED
PENDING → CANCELLED
CONFIRMED → CANCELLED
CONFIRMED → DISPUTED
ACTIVE → COMPLETED
ACTIVE → DISPUTED
```

### Payment Status

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting payment |
| `PROCESSING` | Payment in progress |
| `PAID` | Payment successful |
| `FAILED` | Payment failed |
| `REFUNDED` | Payment refunded |

### Listing Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Visible and bookable |
| `INACTIVE` | Hidden by host |
| `SUSPENDED` | Suspended by admin |
| `DELETED` | Soft-deleted |

### Parking Type

`OPEN`, `COVERED`, `BASEMENT`, `GARAGE`, `PRIVATE`, `COMMERCIAL`

### Vehicle Type

`CAR`, `BIKE`, `SUV`, `TRUCK`, `EV`

### Cancellation Policy

| Policy | Rule |
|--------|------|
| `FLEXIBLE` | Full refund up to 1 hour before |
| `MODERATE` | Full refund up to 24 hours before |
| `STRICT` | 50% refund up to 48 hours before |

### Notification Types

`BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `BOOKING_UPCOMING`, `PAYMENT_UPDATE`, `NEW_HOST_BOOKING`, `REVIEW_REMINDER`, `REVIEW_RECEIVED`, `DISPUTE_UPDATE`, `PAYOUT_UPDATE`, `NEW_MESSAGE`, `SYSTEM`

### Report Target Types

`LISTING`, `USER`, `BOOKING`, `MESSAGE`

### Dispute Status

`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`

### Report Status

`PENDING`, `REVIEWED`, `ACTIONED`, `DISMISSED`
