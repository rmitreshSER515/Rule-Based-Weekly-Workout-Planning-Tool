# Resend, your domain, and email — guide for humans

This document explains **how this project is meant to use [Resend](https://resend.com)**, what **your domain** (`sumanthkanna.me`) is for, how **DNS** fits in, and how that connects to **Vercel** (frontend) and **Render** (backend). It is written in plain language with small examples.

> **Note:** The backend is set up to use environment variables for Resend (see `backend/.env`). The actual “forgot password” email code may be added or extended in the app; this guide describes the **architecture** and **configuration** either way.

---

## 1. The big picture (three separate things)

Imagine three different jobs:

| Piece | What it is | Analogy |
|--------|------------|--------|
| **Your web app (frontend)** | The React site users open in the browser. | The **storefront**. |
| **Your API (backend)** | The server that talks to the database, signs JWTs, and (when wired) asks Resend to send email. | The **back office**. |
| **Your domain + Resend** | A **name you own** plus a **mail service** that actually delivers email to Gmail, Outlook, etc. | The **return address** on an envelope + the **postal service** that carries it. |

They work together, but they are **not** the same product:

- The site can live at a **Vercel URL** like `https://rule-based-weekly-workout-planning.vercel.app`.
- Email can still say it is **from** `you@sumanthkanna.me` because **Resend** sends it **for** you after **DNS** proves you control that domain.

So: **you do not need your custom domain to be the same as the Vercel URL** for transactional email to work.

---

## 2. What is a “domain,” really?

A **domain** (e.g. `sumanthkanna.me`) is a **human-readable name** you rent (register) from a registrar like Namecheap. It is **not** the website files by itself.

Think of it as:

- **The sign above the door** — people recognize it.
- **A slot in the global DNS phone book** — you can attach **different instructions** for different purposes.

Those instructions are **DNS records**: little public rules that say things like:

- “When someone visits this name in a browser, go to **these servers**.” (A records, etc.)
- “When someone checks if email from this domain is legitimate, use **this text** / **this signature**.” (TXT, MX, etc.)

So your domain is **one name**, many possible **uses** (website, email proofs, subdomains, …).

---

## 3. What we use `sumanthkanna.me` for **in this project’s context**

Right now, the important use is:

### **Trusted “From” address for email sent by the app**

When the backend sends mail through Resend, it will use something like:

```text
Workout Planner <noreply@sumanthkanna.me>
```

That means:

- The **visible sender** is `@sumanthkanna.me`.
- **Resend’s computers** actually connect to the big email network and deliver the message.
- **Gmail / Outlook** trust the message more easily because you proved domain ownership via **DNS** in the Resend dashboard (DKIM, SPF, MX as Resend requested).

### **What the domain is *not* (unless you choose it)**

- It is **not** automatically your React app’s URL. Your app can stay on `*.vercel.app` forever.
- You **can** later point `sumanthkanna.me` at Vercel as a **custom domain** for a nicer link — that is optional and separate from email.

---

## 4. What is Resend?

**Resend** is a **transactional email API**:

- Your **backend** sends an HTTPS request to Resend: “Send this email.”
- Resend **delivers** the email to the recipient’s inbox provider.
- Resend requires you to **verify** that you control the domain you put in the **From** field — that is the **DNS records** you added in Namecheap.

**Analogy:**  
You write the letter (subject, body, reset link). **Resend** is the postal service. **Your domain** is the return address printed on the envelope — and the world only believes that return address if **DNS** says you’re allowed to use it.

---

## 5. How DNS fits in (layman version)

**DNS** is a public set of records for your domain. No secrets live in DNS — only **rules** everyone can look up.

When you “add a record in Namecheap,” you are updating a copy of those rules. The internet slowly **propagates** the change (often minutes, sometimes longer).

### Common record types you used with Resend

| Record | Plain English |
|--------|----------------|
| **TXT** | A chunk of text. Used for **DKIM** (a long key) and **SPF** (who may send mail). |
| **MX** | “Where **incoming** mail for this name should be delivered.” Resend may ask for one as part of **their** setup for your domain — add **exactly** what they show. On Namecheap, **MX** is often under **MAIL SETTINGS → Custom MX**, not the same dropdown as A/TXT. |
| **DMARC** (optional) | Extra policy for inbox providers; often a TXT on host `_dmarc`. |

### Why Resend makes you do this

Without DNS proof, **anyone** could pretend to send from `@sumanthkanna.me`. Providers would block or spam-folder that mail.  
After you verify, Resend is allowed to send **as** your domain, and receivers can **check** signatures (DKIM) and allowed senders (SPF).

### SPF and “only one SPF per name”

**SPF** is usually one **TXT** record on a given **host** (often `@` = the root domain).  
You cannot have **two different SPF TXT records** on the same host — they must be **merged** into one line with multiple `include:` parts, or you remove the old one.  
If Namecheap **Email Forwarding** added a locked SPF, you may need to turn forwarding off or merge records so Resend’s SPF can apply.

---

## 6. End-to-end flow (password reset — conceptual)

This is the usual flow **once** the backend calls Resend (same idea as most apps):

1. User opens your **Vercel** site and clicks “Forgot password.”
2. **Frontend** calls your **Render** API with their email.
3. **Backend** creates a **one-time reset token**, stores it (e.g. in MongoDB), builds a link:
   - Base URL from **`FRONTEND_URL`** (see below), e.g.  
     `https://rule-based-weekly-workout-planning.vercel.app/reset-password?token=...`
4. **Backend** calls **Resend’s API** with:
   - **`RESEND_API_KEY`** — proves the request comes from your app’s account.
   - **From** — e.g. `Workout Planner <noreply@sumanthkanna.me>` (must match a **verified** domain in Resend).
   - **To** — the user’s email.
   - **Subject / body** — includes the reset link.
5. **Resend** delivers the email.
6. User clicks the link → **frontend** loads → **backend** accepts new password if token is valid.

**Nothing** in step 4 “sends the domain to you.” The **domain** is only **identity + trust** for the **From** address. The **link** in the email points at **`FRONTEND_URL`**, which is your real app address (often Vercel).

---

## 7. What the code sends **to** Resend (conceptually)

The app does **not** upload your whole DNS to Resend. DNS is public and lives at Namecheap.

The backend sends something **like** (exact fields depend on implementation):

```http
POST https://api.resend.com/emails
Authorization: Bearer re_xxxxxxxx   # your RESEND_API_KEY
Content-Type: application/json

{
  "from": "Workout Planner <noreply@sumanthkanna.me>",
  "to": ["user@example.com"],
  "subject": "Reset your password",
  "html": "<p>Click <a href=\"https://rule-based-weekly-workout-planning.vercel.app/reset-password?token=abc123\">here</a>.</p>"
}
```

- **`from`** must use a domain you **verified** in Resend (`sumanthkanna.me`).
- **`href`** should use **`FRONTEND_URL`** in real code so production and local dev differ correctly.

---

## 8. Environment variables (how config ties together)

A **names-only template** lives at **`backend/.env.example`**. Copy it to **`backend/.env`** locally and fill in secrets (`.env` is gitignored).

These names match what this repo expects in **`backend/.env`** (local) and what you set on **Render** (production). **Never commit real API keys** to git.

| Variable | Role | Example (illustrative only) |
|----------|------|-----------------------------|
| **`RESEND_API_KEY`** | Secret key from Resend dashboard. Identifies **your** Resend account. | `re_...` (generate in Resend → API Keys) |
| **`MAIL_FROM`** | The visible sender. Must be on a **verified** domain in Resend. | `Workout Planner <noreply@sumanthkanna.me>` |
| **`FRONTEND_URL`** | Base URL for links inside emails (no trailing slash). | Local: `http://localhost:5173` — Production: `https://rule-based-weekly-workout-planning.vercel.app` |
| **`MONGODB_URI`** | Database (not Resend-specific). | Your Mongo connection string |
| **`JWT_SECRET`** | Signs auth tokens (not Resend-specific). | Long random string |
| **`CORS_ORIGIN`** | Allowed browser origins for your API. | Your Vercel site URL (comma-separated if several) |

**Frontend (Vercel):**

| Variable | Role |
|----------|------|
| **`VITE_API_URL`** | Public URL of your **Render** API (e.g. `https://your-api.onrender.com`). The browser uses this to call login, schedules, etc. |

---

## 9. Local development vs production (simple)

| Environment | Frontend URL | `FRONTEND_URL` in backend | Resend |
|-------------|--------------|---------------------------|--------|
| **Local** | `http://localhost:5173` | Same | Can use a test sender / or log links if you leave Resend unset in dev |
| **Production** | Vercel URL | Your real `https://...vercel.app` (or custom domain later) | Real **`RESEND_API_KEY`**, **`MAIL_FROM`** on `sumanthkanna.me` |

---

## 10. Checklist you already followed (Resend + Namecheap)

- Added **domain** `sumanthkanna.me` in Resend.
- Added **DNS** at Namecheap exactly as Resend listed (**DKIM** TXT on `resend._domainkey`, plus **SPF** / **MX** / optional **DMARC** as shown).
- Waited for propagation and clicked **Verify** in Resend until the domain is **verified** for sending.

**Create an API key** in Resend and set **`RESEND_API_KEY`** on Render when you enable email in production.

---

## 11. Security habits (short)

- Treat **`RESEND_API_KEY`** like a password — store only in env / host secrets.
- Rotate the key if it leaks.
- **`JWT_SECRET`** is unrelated to Resend but must stay secret too.

---

## 12. Quick glossary

| Term | Meaning |
|------|--------|
| **Registrar** | Where you bought the domain (e.g. Namecheap). |
| **DNS** | Public rules for your domain (A, TXT, MX, …). |
| **DKIM** | Cryptographic signature for outgoing mail tied to your domain. |
| **SPF** | List of servers allowed to send mail for your domain. |
| **Transactional email** | Automated mail (reset, receipt), not a newsletter blast. |

---

## 13. One-sentence summary

**Your domain proves you own the “from” address; Resend delivers the mail; your backend tells Resend what to send using an API key; DNS is the public proof that ties your domain to Resend so the world trusts those emails.**

If you change domain or hosting later, update **DNS in Resend**, **Namecheap records**, **`MAIL_FROM`**, **`FRONTEND_URL`**, **`CORS_ORIGIN`**, and **`VITE_API_URL`** together so everything still lines up.
