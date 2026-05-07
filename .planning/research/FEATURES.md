# Feature Landscape

**Domain:** Authentication
**Researched:** 2024

## Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Standard Google Sign-In Button | Most reliable method across all browsers. Bypasses ITP/ETP. | Low | Required as fallback. |
| JWT Verification | Security requirement to prevent spoofing. | Low | Use `google-auth-library`. |

## Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Google One Tap | Frictionless login, higher conversion. | Medium | Fails on strict browsers; requires FedCM. |
| Automatic Sign-in | Zero-click login for returning users. | Medium | Requires prior authorization. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Manual JWT Parsing | Security risks, missing signature checks. | Use official `google-auth-library`. |
| Email as Primary Key | Emails can change. | Use the `sub` claim. |
