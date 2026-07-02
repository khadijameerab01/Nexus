# Nexus Platform — Architecture & Component Structure

> Documentation prepared for Phase-2 Internship, Milestone 1 (Setup & Familiarization).

## Tech Stack

- **Framework:** React 18 + TypeScript, bundled with Vite 5
- **Routing:** React Router v6 (`BrowserRouter`)
- **Styling:** Tailwind CSS 3, with a custom theme (see `tailwind.config.js`)
- **State/Auth:** React Context API (`AuthContext`) backed by `localStorage` and an in-memory mock user array — there is no real backend yet
- **Notifications:** `react-hot-toast`
- **Icons:** `lucide-react`
- **Utilities already installed but not yet wired up:** `date-fns` (date formatting — useful for the calendar feature), `react-dropzone` (file upload — useful for the document chamber), `axios` (HTTP client, unused since there's no backend yet)

## Folder Structure

```
src/
├── App.tsx              # Top-level route definitions
├── main.tsx              # React root + render
├── index.css             # Tailwind directives only
├── context/
│   └── AuthContext.tsx   # Mock auth: login, register, logout, password reset, profile update
├── data/                 # Mock/seed data (users, etc.) standing in for a backend
├── types/                # Shared TypeScript interfaces (User, Investor, Entrepreneur,
│                          # Message, ChatConversation, CollaborationRequest, Document, AuthContextType)
├── components/
│   ├── ui/                # Generic reusable primitives: Button, Card, Input, Avatar, Badge
│   ├── layout/             # DashboardLayout (page shell), Navbar, Sidebar (role-aware nav)
│   ├── chat/               # ChatMessage, ChatUserList
│   ├── collaboration/      # CollaborationRequestCard
│   ├── investor/           # InvestorCard
│   └── entrepreneur/       # EntrepreneurCard
└── pages/
    ├── auth/               # Login, Register, ForgotPassword, ResetPassword
    ├── dashboard/          # EntrepreneurDashboard, InvestorDashboard (role-specific)
    ├── profile/            # EntrepreneurProfile, InvestorProfile
    ├── investors/          # Browse investors (entrepreneur-facing)
    ├── entrepreneurs/      # Browse startups (investor-facing)
    ├── messages/           # MessagesPage (conversation list)
    ├── chat/                # ChatPage (1:1 conversation thread)
    ├── notifications/      # NotificationsPage
    ├── documents/          # DocumentsPage (existing — base for Document Chamber, Milestone 4)
    ├── deals/               # DealsPage (existing — relevant to Payment/Funding flow, Milestone 5)
    ├── settings/            # SettingsPage
    └── help/                 # HelpPage
```

## Routing Map (`App.tsx`)

| Path | Page | Notes |
|---|---|---|
| `/login`, `/register` | Auth pages | No `DashboardLayout` wrapper |
| `/dashboard/entrepreneur`, `/dashboard/investor` | Role dashboards | Wrapped in `DashboardLayout` |
| `/profile/entrepreneur/:id`, `/profile/investor/:id` | Public-style profile pages | |
| `/investors`, `/entrepreneurs` | Directory/browse pages | |
| `/messages`, `/chat`, `/chat/:userId` | Messaging | |
| `/notifications` | Notifications | |
| `/documents` | Document list | To be extended into the Document Chamber |
| `/deals` | Deals list | To be extended with the payment/funding flow |
| `/settings`, `/help` | Account utility pages | |
| `*` | Redirects to `/login` | No 404 page currently |

All authenticated routes are nested under `<Route element={<DashboardLayout />}>`, which renders the shared `Navbar` + `Sidebar` + `<Outlet />`.

## Auth & Role Model

- `AuthContext` exposes `user`, `login`, `register`, `logout`, `forgotPassword`, `resetPassword`, `updateProfile`, `isAuthenticated`, `isLoading`.
- Auth is **fully mocked**: `login` looks up a matching user in the in-memory `users` array from `src/data/`, no real API call.
- `UserRole` is a union type: `'entrepreneur' | 'investor'`. Almost every shared page (dashboard, sidebar nav, profile) branches its content based on this role.
- There is currently no route-guarding/redirect-if-unauthenticated logic beyond the catch-all `*` route — worth keeping in mind when adding new authenticated features.

## UI Theme (Tailwind)

Defined in `tailwind.config.js`:

- **Color system:** `primary` (blue), `secondary` (teal), `accent` (amber), plus semantic `success` / `warning` / `error` scales — all on a 50–900/950 shade scale for consistency.
- **Typography:** `Inter var`, loaded via CDN link in `index.html` (`rsms.me/inter`).
- **Custom animations:** `fade-in`, `slide-in` keyframes for subtle entrance transitions.
- **Consistency pass (this milestone):** the `success`/`warning`/`error` palettes were previously missing several shades (only 50/500/700 defined) even though components referenced shades like `success-100`. These were filled out to a full 50–900 scale, and a few components using raw Tailwind colors (`bg-green-100`, `bg-yellow-100`) instead of theme tokens were corrected to use `success-*`/`warning-*` for consistency.

## Notes for Upcoming Milestones

- **Milestone 2 (Calendar):** No calendar page/route exists yet. `date-fns` is already installed and ready to use for date logic.
- **Milestone 3 (Video Calling):** No video call UI exists yet; will be a new page/route plus mock WebRTC-style controls.
- **Milestone 4 (Document Chamber):** Can extend the existing `documents/DocumentsPage.tsx` and `Document` type rather than starting from scratch. `react-dropzone` is already installed for uploads.
- **Milestone 5 (Payments):** Can build alongside or extend `deals/DealsPage.tsx`, which already models entrepreneur/investor deal relationships.
- **Milestone 6 (Security/2FA):** No password strength meter or 2FA mockup exists yet; will likely live in `auth/` pages and possibly `SettingsPage`.
