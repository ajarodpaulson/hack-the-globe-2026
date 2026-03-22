export default async function ServerExamplePage() {
  let data;
  let errorMessage = null;

  try {
    const res = await fetch("http://localhost:3000/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageRange: "25-34",
        gender: "woman",
        incomeLevel: "low",
        raceEthnicity: ["indigenous"],
        housingStatus: "unstable",
        employmentStatus: "unemployed",
        language: "english",
        transcript:
          "Provider: What brings you in today? Patient: I've been feeling anxious and having trouble sleeping. Provider: Are you working right now? Patient: No, I lost my job a few months ago. Provider: How is housing? Patient: I've been staying with friends and moving around a lot. Provider: Are you able to afford food and medication? Patient: Not always. I've had to skip meals and sometimes I can't fill prescriptions.",
      }),
      cache: "no-store",
    });

    data = await res.json();
  } catch (error) {
    errorMessage = String(error);
  }

  return (
    <div>
      <h1>Server Component Example</h1>
      {errorMessage ? (
        <>
          <p>
            Failed to fetch — make sure the dev server, Ollama, and DynamoDB
            Local are all running.
          </p>
          <pre>{errorMessage}</pre>
        </>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
