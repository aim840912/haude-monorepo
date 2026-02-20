# E2E Testing Checklist

Reusable checklist for writing E2E tests. Copy relevant sections when requesting test coverage.

---

## Auth Boundary (every protected route)

- [ ] Unauthenticated user → redirected to /login
- [ ] Unauthenticated user → redirect includes return URL (`?from=`)
- [ ] Logged in → logout → access route → redirected to /login
- [ ] localStorage cleared → page reload → redirected to /login
- [ ] Corrupted/partial auth state → redirected to /login

**Currently protected routes**: `/orders`, `/orders/:id`, `/checkout`
**Should be protected (TODO)**: `/account`, `/account/security`, `/account/membership`

---

## Form Validation

- [ ] Empty required fields → shows validation errors
- [ ] Invalid format (email, phone) → shows specific error
- [ ] Exceeds max length → handled gracefully
- [ ] SQL injection / XSS in inputs → sanitized (no script execution)
- [ ] Submit button disabled during request (no double-submit)

---

## API Error States

- [ ] Backend down (network error) → user-friendly error message
- [ ] 401 response → redirected to /login (not blank page)
- [ ] 404 response → "not found" UI (not crash)
- [ ] 500 response → generic error message (not raw stack trace)
- [ ] Slow response (>5s) → loading indicator visible

---

## Data Boundary

- [ ] Empty list → "no items" message (not blank)
- [ ] Single item → layout correct (not stretched/broken)
- [ ] Maximum items → pagination or scroll (not overflowing)
- [ ] Long text content → truncated or wrapped (not overflowing)
- [ ] Missing optional fields → fallback values (not "undefined")

---

## Navigation

- [ ] Browser back button → correct previous page
- [ ] Direct URL access → page loads (not only via navigation)
- [ ] 404 route → custom not-found page
- [ ] Query params → correct filter/sort state

---

## Smoke (every page)

- [ ] Page loads without JS errors (console.error)
- [ ] HTTP status < 500
- [ ] Has visible <body> content
- [ ] Navigation/header renders
- [ ] No layout shifts (images have dimensions)

---

## How to Use

When asking Claude to write tests, include:

```
Write E2E tests for [feature]. Follow the checklist in e2e/testing-checklist.md.
Focus on: [Auth Boundary / Form Validation / Data Boundary / ...]
```
