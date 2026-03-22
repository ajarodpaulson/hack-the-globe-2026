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
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
