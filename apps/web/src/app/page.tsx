import { getEnvironment } from "@afyabridge/config";

export default function HomePage() {
  const environment = getEnvironment();

  return (
    <main>
      <h1>AfyaBridge Community Health</h1>
      <p>Application security baseline for {environment.APP_COUNTRY}.</p>
      <p>No real patient or household data is permitted in this environment.</p>
    </main>
  );
}
