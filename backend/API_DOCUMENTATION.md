# CleanTrack API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Users

### `POST /api/auth/register`
- **Role**: Public (Always creates `citizen` account; Admins cannot be created publicly)
- **Body**: `{ "name": "Aarav Sharma", "email": "aarav@example.com", "password": "SecretPassword123", "phone": "+91 98230 11452", "ward": "Ward 12 - Shivaji Nagar" }`
- **Response**: `{ "success": true, "token": "jwt_token_here", "user": { ... } }`

### `POST /api/auth/login`
- **Role**: Public
- **Body**: `{ "email": "citizen@cleantrack.demo", "password": "CleanTrack@123" }`
- **Response**: `{ "success": true, "token": "jwt_token_here", "user": { ... } }`

### `GET /api/auth/me`
- **Role**: Authenticated (`citizen`, `municipal_staff`, `administrator`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "success": true, "user": { ... } }`

---

## 2. Complaints Management

### `POST /api/complaints`
- **Role**: `citizen`, `municipal_staff`, `administrator`
- **Body**:
```json
{
  "title": "Plastic Waste Overflow near Goodluck Cafe",
  "imageUrl": "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5",
  "latitude": 18.5204,
  "longitude": 73.8423,
  "ward": "Ward 12 - Shivaji Nagar",
  "landmark": "Near Goodluck Cafe",
  "aiCategory": "Plastic Waste",
  "aiSubtype": "PET Bottle & Packaging",
  "aiConfidence": 94,
  "aiCondition": "Overflowing bin",
  "segregationStream": "Dry Waste → Plastic Recycling",
  "severity": "High",
  "aiPriorityScore": 75
}
```
- **Response**: `{ "success": true, "complaint": { "complaintId": "CT-2026-00125", "sla": { "dueAt": "..." }, ... } }`

### `GET /api/complaints`
- **Role**: Authenticated
  - *Citizen*: Only returns complaints submitted by the citizen.
  - *Municipal Staff / Admin*: Returns all complaints with optional filtering by `status`, `ward`, `severity`, `search`.
- **Response**: `{ "success": true, "count": 6, "complaints": [ ... ] }`

### `PATCH /api/complaints/:id`
- **Role**: `municipal_staff`, `administrator`
- **Body**: `{ "status": "In Progress", "officerNote": "Squad dispatched with compactor." }`

### `POST /api/complaints/:id/assign`
- **Role**: `municipal_staff`, `administrator`
- **Body**: `{ "teamId": "team_alpha", "teamName": "Team Alpha (Rapid Response)", "instructions": "Clear overflowing plastic bin" }`

---

## 3. SLA Escalation & Testing

### `POST /api/admin/test/escalate/:complaintId`
- **Role**: Development / Administrator test trigger
- **Description**: Simulates instantaneous SLA deadline breach without waiting 24/48 hours. Auto-elevates priority to `CRITICAL`, appends to `priorityHistory`, creates an audit log, and dispatches escalation alerts.

---

## 4. Before / After Verification & Green Points

### `POST /api/verifications`
- **Role**: `municipal_staff`
- **Body**: `{ "complaintId": "CT-2026-00115", "beforeImage": "...", "afterImage": "...", "visualImprovementScore": 92 }`

### `POST /api/verifications/:id/approve`
- **Role**: `citizen`
- **Description**: Citizen validates cleanup. Sets complaint status to `citizen_verified`, awards `+50 Green Points` in transaction ledger, and dispatches congratulations alert.

### `POST /api/verifications/:id/reject`
- **Role**: `citizen`
- **Description**: Citizen reports remaining waste. Reverts complaint status to `In Progress` and alerts municipal squad.

---

## 5. AI Computer Vision & Telemetry

### `POST /api/ai/analyze`
- **Body**: Multipart form data with `image` file, or JSON with `imageUrl`.
- **Response**: Classification, confidence (94%), condition, segregation stream, and severity breakdown.

### `POST /api/ai/duplicate`
- **Body**: `{ "latitude": 18.5204, "longitude": 73.8423, "ward": "Ward 12" }`
- **Response**: Returns 50m spatial duplicate clusters.

---

## 6. Analytics & Hotspots

### `GET /api/analytics/dashboard`
- **Response**: Clean City Pulse (82/100), monthly complaint trends, waste category distribution, and AI model health telemetry.

### `GET /api/hotspots`
- **Response**: Active GIS spatial hotspots with coordinates, severity colors, and recommended actions.
