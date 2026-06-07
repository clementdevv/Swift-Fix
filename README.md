This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Development

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database (or any Postgres instance)

### Local setup

1. Copy environment variables into `.env` at the project root:

   ```env
   DATABASE_URL="postgresql://..."      # pooled connection (runtime)
   DIRECT_URL="postgresql://..."        # direct connection (migrations/seed)
   AUTH_SECRET="..."                    # openssl rand -base64 32
   AUTH_URL="http://localhost:3000"     # optional locally; required in production
   ```

2. Install dependencies and prepare the database:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Data access patterns

All database reads and writes go through **Server Actions** in `lib/actions/`, backed by **Prisma 7** and **NextAuth v5**. See [docs/DATA_LAYER.md](docs/DATA_LAYER.md) for architecture, auth conventions, booking status mapping, and how to add new features.

### Useful scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client and production build |
| `npm run db:migrate` | Run `prisma migrate dev` |
| `npm run db:seed` | Seed service categories |
| `npm run db:studio` | Open Prisma Studio |

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
