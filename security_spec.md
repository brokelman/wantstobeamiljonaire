# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All unmatched paths in Firestore are strictly denied (`allow read, write: if false;`).
2. **Verified Identity**: Only authenticated users with `request.auth.token.email_verified == true` can read or write `/ideas/{ideaId}` documents.
3. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) validates `isValidId(ideaId)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
4. **Strict Schema & Bounds**: `isValidIdea(data)` enforces exact key sets (`hasAll` and `hasOnly`), string length minimums/maximums matching `firebase-blueprint.json`, valid enum values for `stage` and `dotVerdict`, and numeric ranges.
5. **Ownership & Temporal Integrity**:
   - On `create`: `incoming().authorUid == request.auth.uid`, `incoming().createdAt == request.time`, and `incoming().updatedAt == request.time`.
   - On `update`: `incoming().authorUid == existing().authorUid`, `incoming().createdAt == existing().createdAt`, and `incoming().updatedAt == request.time`.
6. **Query Enforcer on List**: `allow list` verifies `isSignedIn() && isEmailVerified() && resource.data.stage in ['idea', 'validated', 'business_case', 'execution']` so no unverified or malformed document can be listed.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Create**: `auth = null`, creating an idea -> `PERMISSION_DENIED`.
2. **Unverified Email Create**: `auth = { uid: 'u1', token: { email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Spoofed Author UID on Create**: `auth.uid = 'u1'`, payload `authorUid: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload includes extra field `isAdmin: true` -> Rejected by `hasOnly()`.
5. **Oversized String ("Denial of Wallet")**: `title` with 500 characters (> 120 max) -> Rejected by `.size() <= 120`.
6. **Invalid Enum on Stage**: `stage: 'hacked_stage'` -> Rejected by enum check.
7. **Invalid Enum on Dot Verdict**: `dotVerdict: 'super_go'` -> Rejected by enum check.
8. **Client-Forged Timestamp on Create**: `createdAt: timestamp(2020-01-01)` != `request.time` -> `PERMISSION_DENIED`.
9. **Mutating Immutable `authorUid` on Update**: Changing `authorUid` from `'u1'` to `'u2'` -> `PERMISSION_DENIED`.
10. **Mutating Immutable `createdAt` on Update**: Changing `createdAt` during update -> `PERMISSION_DENIED`.
11. **Malformed Document ID Poisoning**: Creating document with ID containing spaces or >128 chars -> Rejected by `isValidId(ideaId)`.
12. **Unauthorized Delete by Non-Owner**: User `'u2'` attempting to delete idea owned by `'u1'` -> `PERMISSION_DENIED`.
