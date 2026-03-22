import analysisService from "@/features/analysis/analysis_service";

export async function GET() {
  try {
    const analyzedEncounters = await analysisService.getAnalyzedEncounters();

    return Response.json({
      ok: true,
      data: analyzedEncounters,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const anonymizedEncounter = await request.json();

    console.log("[api/analysis] Received anonymized encounter", {
      keys: Object.keys(anonymizedEncounter ?? {}),
      hasTranscript: typeof anonymizedEncounter?.transcript === "string",
      transcriptLength:
        typeof anonymizedEncounter?.transcript === "string"
          ? anonymizedEncounter.transcript.length
          : 0,
      ageRange: anonymizedEncounter?.ageRange,
      gender: anonymizedEncounter?.gender,
    });

    const analyzedEncounter =
      await analysisService.createAnalyzedEncounter(anonymizedEncounter);

    return Response.json(
      {
        ok: true,
        data: analyzedEncounter,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/analysis] Failed to create analyzed encounter", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
