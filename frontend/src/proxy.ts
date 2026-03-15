import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'bg'],
  defaultLocale: 'bg'
});

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};
