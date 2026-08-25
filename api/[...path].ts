import { createPmecHttpApp } from "../server/pmec-http-app";

// Vercel invokes this exported Express application for every /api/* request.
// The existing tRPC router remains the server-side authorization boundary.
const app = createPmecHttpApp();

export default app;
