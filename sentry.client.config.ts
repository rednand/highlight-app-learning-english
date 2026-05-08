import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://56dae293fc6c6806cecad186f8b82346@o4506435279126528.ingest.us.sentry.io/4511350011199488",
  tracesSampleRate: 1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
  enableLogs: true,
  sendDefaultPii: true,
  debug: false,
});
