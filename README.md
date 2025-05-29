# Team Enosh Infra Portal

A secure team portal for Enosh Infra employees to access the dashboard and manage operations.

## Features

- **Zoho Mail Authentication**: Login with your company Zoho email
- **Protected Dashboard**: Secure dashboard accessible only to authenticated users
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark theme matching the main Enosh Infra website
>>>>>>> 852cf65 (Phase 1)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Zoho OAuth credentials (for production)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Zoho OAuth credentials

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
teamenoshinfra/
├── pages/
│   ├── index.js          # Login page
│   ├── dashboard.js      # Main dashboard
│   └── _app.tsx         # App wrapper
├── components/
│   ├── DashboardNavbar.js # Navigation for authenticated users
│   └── Footer.js         # Footer component
├── lib/
│   └── zoho-auth.ts     # Zoho OAuth configuration
├── middleware.ts        # Route protection middleware
└── styles/
    └── globals.css      # Global styles
```

## Authentication Flow

1. User visits team.enoshinfra.com
2. Redirected to login page if not authenticated
3. User enters Zoho email
4. Email validation checks for allowed domains
5. On success, user is redirected to dashboard
6. Session cookie is set for 24 hours

## Allowed Email Domains

By default, the following domains are allowed:
- `@enoshinfra.com`
- `@zoho.com`

<<<<<<< HEAD
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> ebefd10 (Initial commit from Create Next App)
=======
To modify allowed domains, update the `allowedDomains` array in `pages/index.js`.

## Dashboard Features

The dashboard includes:
- Property management overview
- Client information
- Pending inquiries
- Revenue tracking
- Task management
- Recent activity feed

## Security

- Routes are protected by middleware
- Session cookies expire after 24 hours
- Email domain validation
- HTTPS required in production

## Deployment

For production deployment:

1. Set up Zoho OAuth application in Zoho Developer Console
2. Update environment variables with production values
3. Deploy to your hosting platform (Vercel, Netlify, etc.)
4. Configure domain to point to team.enoshinfra.com

## Future Enhancements

- Full Zoho OAuth integration
- Role-based access control
- Advanced reporting features
- Real-time notifications
- API integration with property management system

## Support

For issues or questions, contact: admin@enoshinfra.com
>>>>>>> 852cf65 (Phase 1)
