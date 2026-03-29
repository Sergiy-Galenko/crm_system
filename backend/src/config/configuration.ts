export default () => ({
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "Nexora CRM",
    port: Number(process.env.PORT ?? 4000),
    env: process.env.NODE_ENV ?? "development",
  },
});
