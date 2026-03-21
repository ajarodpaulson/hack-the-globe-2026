// Server Component (default in App Router) — can use async/await directly
export default async function ServerExamplePage() {
  const res = await fetch("http://localhost:3000/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello from server component" }),
  });

  const data = await res.json();

  return (
    <div>
      <h1>Server Component Example</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
