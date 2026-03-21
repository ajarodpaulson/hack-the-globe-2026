"use client";

import { useState } from "react";

export default function ClientExamplePage() {
  const [result, setResult] = useState<string>("");
  const [text, setText] = useState("");

  async function handleSubmit() {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div>
      <h1>Client Component Example</h1>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
      />
      <button onClick={handleSubmit}>Send</button>
      {result && <pre>{result}</pre>}
    </div>
  );
}
