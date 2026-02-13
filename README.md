# Video Portfolio Website

Personal portfolio website for showcasing short video clips organized into thematic sections.
Suitable for presenting works, ideas, or projects in a video-based format.

Content management is handled through a dedicated admin panel available only to authorized users.
Administrators can upload videos, create and edit pages, and manage their contact information.

## Features

- Client-facing part for browsing video content
- Admin panel for managing videos and media
- Short videos organized by thematic sections
- Video and image storage via Cloudflare
- Authentication and database via Firebase
- Responsive UI
- Media uploads and previews

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI:** React, Tailwind CSS
- **Forms:** React Hook Form
- **Media & UI:** Three.js, @react-three/fiber, @react-three/drei
- **Storage:** Cloudflare (videos & images)
- **Auth & Database:** Firebase
- **HTTP Client:** Axios

## Project Structure

- Client part — public portfolio pages
- Admin part — content and media management
- Environment-based configuration
- Separation of client and admin logic

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=

```

## Project setup

run in dev mode

```bash
npm run dev
```

production build

```bash
npm run build
```

deploy to Netlify

```bash
npm run deploy
```

## Notes

- Firebase is used for authentication and database management
- Cloudflare is used for storing video and image files
- Environment variables are required for the application to work correctly
