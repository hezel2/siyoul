# Security Specification: Saju Archive (Firestore Rules)

## 1. Data Invariants
1. A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the verified Google-authenticated user whose `request.auth.uid == userId`.
2. A `SajuReading` document at `/users/{userId}/readings/{readingId}` cannot exist unless its parent `/users/{userId}` profile document exists (`exists(...)`), and `ownerId` strictly equals `request.auth.uid`.
3. All document IDs (`userId`, `readingId`) must match `^[a-zA-Z0-9_\-]+$` with length `1..128`.
4. All strings and nested maps are strictly size-bounded and type-checked to prevent Denial of Wallet / 1MB payload injection.
5. `createdAt` and `ownerId` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
6. Updates to `SajuReading` are strictly limited to user annotation fields (`memo`, `isPinned`, `updatedAt`); calculated `calculation` and AI-generated `report` payloads cannot be tampered with after creation.
7. `list` queries on `/users/{userId}/readings` explicitly evaluate `resource.data.ownerId == request.auth.uid` without calling `get()` or `exists()`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: `request.auth == null` reading `/users/u1/readings/r1`.
2. **Unverified Email Write**: `request.auth.token.email_verified == false` creating `/users/u1/readings/r1`.
3. **Cross-Tenant Read**: User `u2` attempting `get` or `list` on `/users/u1/readings`.
4. **Owner Spoofing on Create**: User `u1` creating `/users/u1/readings/r1` with `ownerId: "u2"`.
5. **Orphaned Reading Create**: User `u1` creating `/users/u1/readings/r1` before `/users/u1` exists.
6. **ID Poisoning**: Creating `/users/u1/readings/bad$id..` or 200-char ID.
7. **Shadow / Ghost Field Injection**: Creating `/users/u1` with `{ uid: "u1", displayName: "Kim", isAdmin: true, createdAt: ..., updatedAt: ... }`.
8. **Client Timestamp Forgery**: Creating a reading with a backdated `createdAt` instead of `request.time`.
9. **Immutable Owner Tampering**: Updating `/users/u1/readings/r1` to change `ownerId` or `createdAt`.
10. **Immutable Calculation/Report Tampering**: Updating `calculation` or `report` fields on an existing `SajuReading`.
11. **Oversized Memo Injection**: Updating `memo` with a 2,000-character string (> 500 max).
12. **Root Catch-All Bypass**: Writing to any undeclared collection such as `/admins/u1` or `/public/test`.
