# TASKLYN

Professional task management for teams. Create shared lists, assign tasks, control permissions, and track who completes every action.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated routes (sidebar layout)
│   │   ├── dashboard/      # Dashboard — personal & shared lists
│   │   └── lists/[id]/     # List detail — tasks, members, sharing
│   ├── invite/[token]/     # Invitation accept/reject page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Login / landing page
├── components/
│   ├── layout/             # Sidebar, Header, AppLayout
│   ├── lists/              # ListCard, CreateListModal
│   ├── members/            # MembersPanel (roles, invite links)
│   ├── shared/             # Logo
│   ├── tasks/              # TaskItem, CreateTaskForm
│   └── ui/                 # Button, Modal, Badge, Avatar, Input, Select, etc.
├── lib/
│   ├── permissions.ts      # Role & plan permission checks
│   └── utils.ts            # Helpers (generateId, formatDate, cn, etc.)
├── stores/
│   ├── authStore.ts        # Auth state (demo user, ready for Firebase)
│   ├── invitationStore.ts  # Invitation tokens & links
│   ├── listStore.ts        # Lists CRUD & member management
│   └── taskStore.ts        # Tasks CRUD, completion tracking, history
└── types/
    └── index.ts            # All TypeScript interfaces & plan limits
```

## Features

- **Task Lists** — Create personal or shared lists
- **Role-Based Permissions** — Owner, Editor, Viewer with strict access control
- **Task Completion Tracking** — Records exactly who completed each task
- **Activity History** — Full audit trail per task (created, edited, completed, reopened)
- **Invite via Link** — Generate shareable `/invite/[token]` links
- **Members Panel** — View members, change roles, remove users (owner only)
- **Plan System** — FREE/PRO tiers with feature gates (list limits, member limits)
- **Modern UI** — Minimalist SaaS design with smooth animations

## Permission Rules

| Action            | Owner | Editor | Viewer |
| ----------------- | ----- | ------ | ------ |
| View tasks        | Yes   | Yes    | Yes    |
| Create/edit tasks | Yes   | Yes    | No     |
| Complete tasks    | Yes   | No     | No     |
| Delete tasks      | Yes   | No     | No     |
| Invite members    | Yes   | No     | No     |
| Change roles      | Yes   | No     | No     |
| Remove members    | Yes   | No     | No     |
| Delete list       | Yes   | No     | No     |

## Firebase Integration (Prepared)

The app is architecturally ready for Firebase:

- **Auth store** has `login`/`logout` methods ready to wrap `signInWithPopup`
- **User type** matches Firebase Auth user profile shape
- **Stores** are structured for easy migration to Firestore collections
- **Invitation tokens** map directly to a Firestore `invitations` collection

## Deployment

```bash
npm run build    # Production build
npm start        # Start production server
```

Ready for deployment on Vercel, Netlify, or any Node.js hosting.
