// Server Component (default in App Router) — can use async/await directly
export default async function ServerExamplePage() {
  try {
    const res = await fetch("http://localhost:3000/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageRange: "25-34",
        gender: "Female",
        lat: 43.65107,
        lng: -79.347015,
        transcript:
          "My name is Jane Smith and I live at 123 Main St. My phone number is 416-555-1234.",
      }),
    });

    const data = await res.json();

    return (
      <div>
        <h1>Server Component Example</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  } catch (error) {
    return (
      <div>
        <h1>Server Component Example</h1>
        <p>Failed to fetch — make sure the dev server and Ollama are both running.</p>
        <pre>{String(error)}</pre>
      </div>
    );
  }
}
