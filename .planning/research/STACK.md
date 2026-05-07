# Technology Stack

**Project:** Metaskills
**Researched:** 2024

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Google Identity Services (GIS) | Latest | Frontend Auth | Replaces deprecated `google-signin`. Supports FedCM. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `google-auth-library` | Latest | Backend Token Verification | Whenever validating GIS JWTs on Node.js backend. |

## Installation

```bash
# Backend verification
npm install google-auth-library
```

## Sources
- Google Identity Services Documentation
- Google Auth Library GitHub
