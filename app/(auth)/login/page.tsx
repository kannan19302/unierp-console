export default function LoginPage() {
  return (
    <div>
      <h1>UniERP Platform Admin Console</h1>
      <p>Control-plane access — platform operators only.</p>
      <p>
        Authentication via OIDC (Authorization Code + PKCE) with mandatory MFA.
      </p>
      {/* OIDC login button wired to provider IdP realm */}
    </div>
  );
}
