# ParkKaro — Database Schema (DynamoDB)

> **Owner:** Person 2 (Backend)  
> **Last Updated:** 2026-09-18  
> **DynamoDB Table Prefix:** `parkkaro-` (configurable via `DYNAMODB_TABLE_PREFIX`)

---

## Table of Contents

1. [Users](#1-users)
2. [ParkingListings](#2-parkinglistings)
3. [Bookings](#3-bookings)
4. [SlotLocks (Double-Booking Prevention)](#4-slotlocks-double-booking-prevention)
5. [Vehicles](#5-vehicles)
6. [Reviews](#6-reviews)
7. [Favorites](#7-favorites)
8. [Payments](#8-payments)
9. [Payouts](#9-payouts)
10. [Notifications](#10-notifications)
11. [Conversations](#11-conversations)
12. [Messages](#12-messages)
13. [Disputes](#13-disputes)
14. [Reports](#14-reports)
15. [Double-Booking Prevention Strategy](#15-double-booking-prevention-strategy)
16. [Access Patterns](#16-access-patterns)

---

## 1. Users

**Table:** `parkkaro-users`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `userId` (String) | Partition Key — UUID or Cognito sub |
| email | String | User email (unique) |
| name | String | Display name |
| phone | String | Phone number |
| role | String | `DRIVER` / `HOST` / `ADMIN` |
| profileImage | String | S3 URL |
| status | String | `ACTIVE` / `SUSPENDED` / `DELETED` |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `email-index` | email | — | Lookup user by email |
| `role-index` | role | createdAt | List users by role |

---

## 2. ParkingListings

**Table:** `parkkaro-parking`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `listingId` (String) | Partition Key — UUID |
| hostId | String | Owner user ID |
| title | String | Listing title |
| description | String | Detailed description |
| address | String | Full address |
| area | String | Neighborhood (e.g., Koramangala) |
| city | String | City (e.g., Bengaluru) |
| latitude | Number | GPS latitude |
| longitude | Number | GPS longitude |
| parkingType | String | `OPEN` / `COVERED` / `BASEMENT` / `GARAGE` / `PRIVATE` / `COMMERCIAL` |
| capacity | Number | Total parking spaces |
| vehicleTypes | List\<String\> | Supported vehicle types |
| pricePerHour | Number | Hourly rate (₹) |
| pricePerDay | Number | Daily rate (₹) — optional |
| monthlyPrice | Number | Monthly rate (₹) — optional |
| amenities | List\<String\> | `covered`, `cctv`, `security`, `lighting`, `evCharging`, `accessible`, `24x7` |
| photos | List\<String\> | S3 URLs |
| availability | Map | Default operating hours |
| bookingSettings | Map | Min/max duration, advance booking, etc. |
| cancellationPolicy | String | `FLEXIBLE` / `MODERATE` / `STRICT` |
| rating | Number | Average rating (0-5) |
| reviewCount | Number | Total reviews |
| status | String | `ACTIVE` / `INACTIVE` / `SUSPENDED` / `DELETED` |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `hostId-index` | hostId | createdAt | Host's listings |
| `area-price-index` | area | pricePerHour | Search by area + price |
| `city-index` | city | createdAt | Search by city |
| `status-index` | status | createdAt | Active listings |

---

## 3. Bookings

**Table:** `parkkaro-bookings`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `bookingId` (String) | Partition Key — UUID |
| listingId | String | Parking listing ID |
| hostId | String | Host user ID |
| driverId | String | Driver user ID |
| vehicleId | String | Vehicle used |
| startTime | String | ISO 8601 booking start |
| endTime | String | ISO 8601 booking end |
| durationHours | Number | Duration in hours |
| baseAmount | Number | Base price |
| platformFee | Number | Platform commission |
| tax | Number | Tax amount |
| totalAmount | Number | Total charged to driver |
| hostEarnings | Number | Amount host receives |
| paymentStatus | String | `PENDING` / `PAID` / `FAILED` / `REFUNDED` |
| bookingStatus | String | `PENDING` / `CONFIRMED` / `ACTIVE` / `COMPLETED` / `CANCELLED` / `DISPUTED` |
| qrData | String | Base64-encoded QR payload |
| qrVerificationCode | String | Short verification code |
| cancellationReason | String | Reason if cancelled |
| cancelledBy | String | Who cancelled |
| cancelledAt | String | When cancelled |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `driverId-index` | driverId | createdAt | Driver's bookings |
| `hostId-index` | hostId | createdAt | Host's bookings |
| `listingId-index` | listingId | startTime | Listing's bookings (for availability) |
| `status-index` | bookingStatus | createdAt | Bookings by status |

---

## 4. SlotLocks (Double-Booking Prevention)

**Table:** `parkkaro-slot-locks`

> **This table is the core of the double-booking prevention strategy.** See Section 15 for the full strategy.

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `listingId` (String) | Partition Key |
| **SK** | `slotKey` (String) | Sort Key — formatted as `{date}#{slotIndex}` |
| bookingId | String | Booking that holds this slot |
| driverId | String | Driver who booked |
| startTime | String | ISO 8601 |
| endTime | String | ISO 8601 |
| status | String | `BOOKED` / `RELEASED` |
| createdAt | String | ISO 8601 |

See [Section 15](#15-double-booking-prevention-strategy) for how this table works.

---

## 5. Vehicles

**Table:** `parkkaro-vehicles`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `vehicleId` (String) | Partition Key — UUID |
| userId | String | Owner user ID |
| vehicleNumber | String | License plate |
| vehicleType | String | `CAR` / `BIKE` / `SUV` / `TRUCK` / `EV` |
| make | String | Manufacturer |
| model | String | Model name |
| color | String | Vehicle color |
| isDefault | Boolean | Default vehicle |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `userId-index` | userId | createdAt | User's vehicles |

---

## 6. Reviews

**Table:** `parkkaro-reviews`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `reviewId` (String) | Partition Key — UUID |
| listingId | String | Reviewed listing |
| bookingId | String | Associated booking |
| userId | String | Reviewer |
| rating | Number | 1-5 stars |
| comment | String | Review text |
| createdAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `listingId-index` | listingId | createdAt | Listing's reviews |
| `userId-index` | userId | createdAt | User's reviews |
| `bookingId-index` | bookingId | — | Prevent duplicate per booking |

---

## 7. Favorites

**Table:** `parkkaro-favorites`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `userId` (String) | Partition Key |
| **SK** | `listingId` (String) | Sort Key |
| createdAt | String | ISO 8601 |

No GSIs needed — queries are always by userId.

---

## 8. Payments

**Table:** `parkkaro-payments`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `paymentId` (String) | Partition Key — UUID |
| bookingId | String | Associated booking |
| userId | String | Payer (driver) |
| amount | Number | Total amount |
| currency | String | `INR` |
| status | String | `PENDING` / `PROCESSING` / `PAID` / `FAILED` / `REFUNDED` |
| provider | String | Payment provider (e.g., `MOCK`, `RAZORPAY`) |
| providerRef | String | External transaction ID |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `bookingId-index` | bookingId | — | Payment for booking |
| `userId-index` | userId | createdAt | User's payments |

---

## 9. Payouts

**Table:** `parkkaro-payouts`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `payoutId` (String) | Partition Key — UUID |
| hostId | String | Recipient host |
| amount | Number | Payout amount |
| currency | String | `INR` |
| status | String | `PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` |
| period | String | `2026-09` (month) |
| bookingIds | List\<String\> | Bookings included |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `hostId-index` | hostId | createdAt | Host's payouts |

---

## 10. Notifications

**Table:** `parkkaro-notifications`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `userId` (String) | Partition Key |
| **SK** | `notificationId` (String) | Sort Key — `{timestamp}#{uuid}` for ordering |
| type | String | `BOOKING_CONFIRMED`, `BOOKING_CANCELLED`, etc. |
| title | String | Notification title |
| message | String | Notification body |
| data | Map | Related IDs (bookingId, listingId, etc.) |
| read | Boolean | Read status |
| createdAt | String | ISO 8601 |

No additional GSIs — queries are always by userId with sort.

---

## 11. Conversations

**Table:** `parkkaro-conversations`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `conversationId` (String) | Partition Key — UUID |
| participants | List\<String\> | [userId1, userId2] |
| listingId | String | Related listing (optional) |
| bookingId | String | Related booking (optional) |
| lastMessageAt | String | ISO 8601 |
| lastMessagePreview | String | Truncated last message |
| createdAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `participant1-index` | participants[0] | lastMessageAt | User's conversations |
| `participant2-index` | participants[1] | lastMessageAt | User's conversations |

> **Note:** Since DynamoDB doesn't support array element indexing for GSIs, we store two additional attributes `participant1` and `participant2` and create GSIs on those.

---

## 12. Messages

**Table:** `parkkaro-messages`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `conversationId` (String) | Partition Key |
| **SK** | `messageId` (String) | Sort Key — `{timestamp}#{uuid}` |
| senderId | String | Message sender |
| content | String | Message text |
| createdAt | String | ISO 8601 |

No additional GSIs — messages are always queried by conversationId.

---

## 13. Disputes

**Table:** `parkkaro-disputes`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `disputeId` (String) | Partition Key — UUID |
| bookingId | String | Related booking |
| reportedBy | String | User who filed |
| reason | String | Dispute reason |
| description | String | Detailed description |
| evidence | List\<String\> | S3 URLs |
| status | String | `OPEN` / `UNDER_REVIEW` / `RESOLVED` / `DISMISSED` |
| resolution | String | Resolution description |
| resolvedBy | String | Admin who resolved |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `bookingId-index` | bookingId | — | Disputes for booking |
| `status-index` | status | createdAt | Open disputes for admin |
| `reportedBy-index` | reportedBy | createdAt | User's disputes |

---

## 14. Reports

**Table:** `parkkaro-reports`

| Attribute | Type | Description |
|-----------|------|-------------|
| **PK** | `reportId` (String) | Partition Key — UUID |
| reportedBy | String | Reporter user ID |
| targetType | String | `LISTING` / `USER` / `BOOKING` / `MESSAGE` |
| targetId | String | ID of reported entity |
| reason | String | Report reason |
| description | String | Details |
| status | String | `PENDING` / `REVIEWED` / `ACTIONED` / `DISMISSED` |
| reviewedBy | String | Admin who reviewed |
| createdAt | String | ISO 8601 |
| updatedAt | String | ISO 8601 |

**GSIs:**

| GSI Name | PK | SK | Purpose |
|----------|----|----|---------|
| `status-index` | status | createdAt | Pending reports for admin |
| `reportedBy-index` | reportedBy | createdAt | User's reports |

---

## 15. Double-Booking Prevention Strategy

### The Problem

Two drivers submit booking requests for overlapping time ranges on the same listing at nearly the same instant. Both pass the availability check. Both proceed to create bookings. **Result: double-booking.**

Simple conditional writes on the booking table cannot prevent this because the overlap detection requires comparing against a *set* of existing time ranges, not a single attribute value.

### The Solution: Time-Slot Locking Table

We discretize time into fixed-size **slots** (30-minute granularity) and use DynamoDB's `PutItem` with `ConditionExpression` (attribute_not_exists) on each required slot.

#### How it works:

1. **Slot Calculation:** A booking from `10:00` to `12:00` requires slots: `10:00`, `10:30`, `11:00`, `11:30` (4 × 30-min slots).

2. **Atomic Reservation:** We use a `TransactWriteItems` operation to atomically write ALL required slot-lock records. Each slot-lock has:
   - PK: `listingId`
   - SK: `{date}#{slotIndex}` (e.g., `2026-09-20#20` for the 10:00 slot on Sept 20)
   - ConditionExpression: `attribute_not_exists(PK)` — fails if the slot is already taken.

3. **Atomicity:** DynamoDB transactions are all-or-nothing. If ANY slot is already taken, the ENTIRE transaction fails with `TransactionCanceledException`. This guarantees no partial bookings.

4. **Multi-capacity listings:** For listings with `capacity > 1`, the SK includes a space index: `{date}#{slotIndex}#space{N}`. The booking service tries space 0, then space 1, etc., until it finds available space or all are taken.

5. **Cancellation:** When a booking is cancelled, the slot-lock records are updated to `status: RELEASED` (or deleted), freeing the slots for future bookings.

#### Race Condition Handling:

```
User A: TransactWrite [slot 20, 21, 22, 23] → ConditionCheck(attribute_not_exists)
User B: TransactWrite [slot 20, 21, 22, 23] → ConditionCheck(attribute_not_exists)

DynamoDB serializes these transactions.
One succeeds, one gets TransactionCanceledException.
The losing request returns HTTP 409 CONFLICT.
```

#### Slot Index Formula:

```
slotIndex = (hour × 2) + (minute >= 30 ? 1 : 0)
```

Examples:
- 00:00 → slot 0
- 10:00 → slot 20
- 10:30 → slot 21
- 23:30 → slot 47

#### Why not use booking table conditions?

DynamoDB conditional expressions operate on a single item. You cannot conditionally check "no overlapping items exist in this table" with a single `PutItem`. The slot-lock approach transforms the overlap problem into a set of individual item existence checks, which DynamoDB transactions handle atomically.

---

## 16. Access Patterns

### Driver

| Pattern | Table | Query |
|---------|-------|-------|
| My bookings | bookings | GSI `driverId-index` |
| My vehicles | vehicles | GSI `userId-index` |
| My favorites | favorites | PK = userId |
| My notifications | notifications | PK = userId |
| My reviews | reviews | GSI `userId-index` |
| Search parking | parking | GSI `area-price-index` + filter |
| Check availability | slot-locks | Query PK = listingId, SK begins_with date |

### Host

| Pattern | Table | Query |
|---------|-------|-------|
| My listings | parking | GSI `hostId-index` |
| My bookings | bookings | GSI `hostId-index` |
| My payouts | payouts | GSI `hostId-index` |
| Listing reviews | reviews | GSI `listingId-index` |

### Admin

| Pattern | Table | Query |
|---------|-------|-------|
| All users | users | Scan (paginated) |
| Users by role | users | GSI `role-index` |
| Open disputes | disputes | GSI `status-index` |
| Pending reports | reports | GSI `status-index` |
| All bookings | bookings | Scan (paginated) |

---

## Summary of Tables

| # | Table Name | PK | SK | GSI Count |
|---|-----------|----|----|-----------|
| 1 | parkkaro-users | userId | — | 2 |
| 2 | parkkaro-parking | listingId | — | 4 |
| 3 | parkkaro-bookings | bookingId | — | 4 |
| 4 | parkkaro-slot-locks | listingId | slotKey | 0 |
| 5 | parkkaro-vehicles | vehicleId | — | 1 |
| 6 | parkkaro-reviews | reviewId | — | 3 |
| 7 | parkkaro-favorites | userId | listingId | 0 |
| 8 | parkkaro-payments | paymentId | — | 2 |
| 9 | parkkaro-payouts | payoutId | — | 1 |
| 10 | parkkaro-notifications | userId | notificationId | 0 |
| 11 | parkkaro-conversations | conversationId | — | 2 |
| 12 | parkkaro-messages | conversationId | messageId | 0 |
| 13 | parkkaro-disputes | disputeId | — | 3 |
| 14 | parkkaro-reports | reportId | — | 2 |

**Total: 14 tables, 24 GSIs**

---

## IAM Permissions Required

Person 3 must grant the backend Lambda/ECS role:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:BatchWriteItem",
    "dynamodb:BatchGetItem",
    "dynamodb:TransactWriteItems",
    "dynamodb:TransactGetItems"
  ],
  "Resource": [
    "arn:aws:dynamodb:*:*:table/parkkaro-*",
    "arn:aws:dynamodb:*:*:table/parkkaro-*/index/*"
  ]
}
```
