"use client";

import { useState } from "react";

export default function ClientExamplePage() {
  const [result, setResult] = useState<string>("");
  const [transcript, setTranscript] = useState("");

  async function handleSubmit() {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageRange: "25-34",
        gender: "Female",
        lat: 43.65107,
        lng: -79.347015,
        transcript,
      }),
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div>
      <h1>Client Component Example</h1>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Enter a transcript with PII to test masking..."
        rows={4}
        style={{ width: "100%", maxWidth: 500 }}
      />
      <br />
      <button onClick={handleSubmit}>Send</button>
      {result && <pre>{result}</pre>}
    </div>
  );
}
