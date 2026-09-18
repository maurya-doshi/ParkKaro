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
        "notificationId": "2026-09-18T10:00:00.000Z#notif_123",
        "type": "BOOKING_CONFIRMED",
        "title": "Booking Confirmed",
        "message": "Your booking at Covered Parking Near Forum Mall is confirmed.",
        "data": { "bookingId": "booking_def456", "listingId": "listing_abc123" },
        "read": false,
        "createdAt": "2026-09-18T10:00:00.000Z"
      }
    ],
    "unreadCount": 3
  }
}
```

---

### POST /notifications/{id}/read

Mark notification as read.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any (own) |

**Response (200):**

```json
{ "success": true, "data": { "message": "Notification marked as read" } }
```

---

## Messaging

### GET /conversations

List user's conversations.

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
        "conversationId": "conv_abc",
        "participants": ["user_driver1", "user_host1"],
        "listingId": "listing_abc123",
        "lastMessageAt": "2026-09-18T14:00:00.000Z",
        "lastMessagePreview": "Is the spot available...",
        "createdAt": "2026-09-18T13:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /conversations/{id}/messages

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Participant only |

**Response (200):** Paginated list of messages.

---

### POST /conversations/{id}/messages

Send a message.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Participant only |

**Request Body:**

```json
{ "content": "Is the parking spot available tomorrow?" }
```

**Response (201):** Created message object.

---

## Disputes

### POST /disputes

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, HOST |

**Request Body:**

```json
{
  "bookingId": "booking_def456",
  "reason": "Spot was occupied by another vehicle",
  "description": "I arrived and found the spot taken.",
  "evidence": ["https://s3.../photo1.jpg"]
}
```

**Response (201):** Dispute object with status `OPEN`.

---

### GET /disputes

List user's disputes.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER, HOST, ADMIN |

---

### GET /disputes/{id}

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Involved party or ADMIN |

---

### PATCH /disputes/{id}

Update dispute (admin resolution).

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | ADMIN |

**Request Body:**

```json
{
  "status": "RESOLVED",
  "resolution": "Full refund issued to driver."
}
```

---

## Reports

### POST /reports

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
  "description": "The photos don't match the actual location."
}
```

**Response (201):** Report object.

---

### GET /reports

List reports. Users see their own reports; admins see all.

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | Any (own), ADMIN (all) |

---

## Host Dashboard

### GET /host/dashboard

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | HOST |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalListings": 3,
    "activeListings": 2,
    "upcomingBookings": 5,
    "activeBookings": 1,
    "completedBookings": 42,
    "totalEarnings": 45000,
    "monthlyEarnings": 8500,
    "occupancyRate": 0.72,
    "averageRating": 4.3,
    "recentBookings": [
      {
        "bookingId": "booking_def456",
        "listingTitle": "Covered Parking Near Forum Mall",
        "driverName": "John",
        "startTime": "2026-09-20T10:00:00.000Z",
        "endTime": "2026-09-20T12:00:00.000Z",
        "amount": 88,
        "status": "CONFIRMED"
      }
    ]
  }
}
```

---

## Driver Dashboard

### GET /driver/dashboard

| Field | Value |
|-------|-------|
| **Auth** | Required |
| **Role** | DRIVER |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "upcomingBookings": [ ... ],
    "pastBookings": [ ... ],
    "activeBooking": null,
    "favoriteCount": 5,
    "vehicleCount": 2,
    "reviewCount": 8,
    "unreadNotifications": 3
  }
}
```

---

## Admin APIs

All admin APIs require `ADMIN` role. Role is verified server-side from authenticated identity.

### GET /admin/users

List all users with optional filters.

**Query:** `role`, `status`, `limit`, `nextToken`

---

### GET /admin/listings

List all listings with optional filters.

**Query:** `status`, `area`, `limit`, `nextToken`

---

### GET /admin/bookings

List all bookings.

**Query:** `status`, `limit`, `nextToken`

---

### GET /admin/reports

List all reports.

**Query:** `status`, `limit`, `nextToken`

---

### GET /admin/disputes

List all disputes.

**Query:** `status`, `limit`, `nextToken`

---

### GET /admin/analytics

Platform-wide analytics.

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
    "totalRevenue": 125000,
    "platformEarnings": 12500,
    "averageRating": 4.2,
    "bookingsToday": 8,
    "revenueToday": 2400
  }
}
```

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

`BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, `BOOKING_UPCOMING`, `PAYMENT_UPDATE`, `NEW_HOST_BOOKING`, `REVIEW_REMINDER`, `DISPUTE_UPDATE`, `SYSTEM`

### Report Target Types

`LISTING`, `USER`, `BOOKING`, `MESSAGE`

### Dispute Status

`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`

### Report Status

`PENDING`, `REVIEWED`, `ACTIONED`, `DISMISSED`
