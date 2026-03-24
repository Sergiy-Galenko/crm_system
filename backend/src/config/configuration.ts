export default () => ({
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Vercel CRM Suite",
    port: Number(process.env.PORT ?? 4000),
    env: process.env.NODE_ENV ?? "development",
  },
});
