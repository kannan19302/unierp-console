import { test as setup } from "@playwright/test";

export const TEST_AGENT_PAYLOAD = {
  sid: "universal-test-agent-session",
  userId: "00000000-0000-0000-0000-000000000001",
  email: "test.agent@unierp.com",
  name: "Test Agent",
  role: "SUPER_ADMIN",
  permissions: ["*"],
  tenantId: "00000000-0000-0000-0000-000000000001",
  realm: "provider",
  mfaVerified: true,
};

export const TEST_AGENT_COOKIE = {
  name: "__session",
  value: `header.${Buffer.from(JSON.stringify(TEST_AGENT_PAYLOAD)).toString("base64")}.signature`,
  domain: "localhost",
  path: "/",
};

setup("authenticate", async ({ context }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
});
