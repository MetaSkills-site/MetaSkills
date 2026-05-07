# Domain Pitfalls

**Domain:** Authentication
**Researched:** 2024

## Critical Pitfalls

### Pitfall 1: No Fallback for One Tap
**What goes wrong:** Safari and Firefox users see no login option because ITP/ETP blocks the third-party cookies needed for One Tap.
**Why it happens:** Browser privacy protections block cross-site tracking.
**Consequences:** Users cannot log in.
**Prevention:** Always implement a standard "Sign in with Google" button alongside One Tap.

### Pitfall 2: Trusting Client-Side User Data
**What goes wrong:** Backend trusts the user ID sent directly from the frontend without verifying the JWT.
**Why it happens:** Developer misunderstanding of OAuth/OIDC security.
**Consequences:** Anyone can spoof any user by sending a crafted request to the backend.
**Prevention:** Always verify the JWT signature and the `aud` claim on the backend using `google-auth-library`.

### Pitfall 3: Using Email as Primary Key
**What goes wrong:** A user changes their Google account email, creating a new disconnected account in your system.
**Consequences:** Data loss/split accounts.
**Prevention:** Use the `sub` claim from the JWT as the permanent database primary key.
