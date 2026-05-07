# Research Summary: Google Auth Web

**Domain:** Authentication
**Researched:** 2024
**Overall confidence:** HIGH

## Executive Summary

Google Identity Services (GIS) has transitioned towards FedCM to combat third-party cookie blocking (ITP in Safari, ETP in Firefox). While FedCM works smoothly in Chrome, standard Sign-In buttons (popups/redirects) remain the mandatory fallback for Safari and Firefox. Web-to-backend authentication relies on verifying JWT ID Tokens via Google's official auth libraries, using the `sub` claim as the permanent user identifier.

## Key Findings

**Stack:** GIS client library (frontend) + `google-auth-library` (backend)
**Architecture:** Frontend retrieves JWT -> HTTPS POST -> Backend verifies signature and claims -> Issue session based on `sub`.
**Critical pitfall:** Relying solely on "One Tap" which fails in Safari/Firefox without a standard button fallback.

## Implications for Roadmap

1. **Authentication Phase** - Implement standard Google Sign-In button first.
   - Addresses: Core authentication for all browsers.
   - Avoids: Safari/Firefox blockage.

2. **One Tap Enhancement Phase** - Add One Tap for frictionless login on supported browsers.
   - Addresses: Conversion rate optimization.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official Google documentation |
| Features | HIGH | Verified FedCM behavior and fallbacks |
| Architecture | HIGH | Standard JWT verification process |
| Pitfalls | HIGH | Known ITP/ETP behaviors |
