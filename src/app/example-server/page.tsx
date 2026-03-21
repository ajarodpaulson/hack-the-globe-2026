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
          "My name is Sarah Johnson and I'm 34 years old. I live at 456 Queen Street West, Toronto. I've been struggling to afford my medication since I lost my job at the warehouse last March. My doctor, Dr. Michael Chen, referred me to a food bank near my address. I've been feeling very anxious and my blood pressure has been high.",
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
