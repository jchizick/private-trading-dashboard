import { normalizeReturnPath } from "@/lib/dashboardAuth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (error === "missing_config") {
    return "Dashboard password is not configured.";
  }

  if (error === "invalid") {
    return "Incorrect password.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = normalizeReturnPath(params?.next);
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="loginScreen">
      <form className="loginPanel" action="/api/login" method="post">
        <input type="hidden" name="next" value={nextPath} />
        <div className="loginPanel__header">
          <span>Secure terminal</span>
          <h1>Market Command</h1>
        </div>
        <label className="loginPanel__field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            autoFocus
            name="password"
            required
            type="password"
          />
        </label>
        {errorMessage ? <p className="loginPanel__error">{errorMessage}</p> : null}
        <button className="loginPanel__button" type="submit">
          Unlock dashboard
        </button>
      </form>
    </main>
  );
}
