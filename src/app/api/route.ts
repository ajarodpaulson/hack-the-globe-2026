import { NextRequest, NextResponse } from "next/server";
import {
  maskPII,
  classifyTranscript,
  type EncounterRecord,
  type BiographicFactors,
} from "./utils/interview-parsing";

type RequestBody = {
  ageRange?: string;
  gender?: string;
  lat?: number;
  lng?: number;
  transcript: string;
};

export async function POST(request: NextRequest) {
  const { ageRange, gender, lat, lng, transcript }: RequestBody =
    await request.json();

  if (!transcript) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 }
    );
  }

  const maskedText = await maskPII(transcript);
  const { upstreamDeterminants, healthIssues } =
    await classifyTranscript(maskedText);

  // Build biographic factors from user-provided fields only
  const biographicFactors: BiographicFactors = {};
  if (ageRange) biographicFactors.ageRange = ageRange;
  if (gender) biographicFactors.gender = gender;

  const record: EncounterRecord = {
    analyzedEncounterRn: maskedText,
    biographicFactors:
      Object.keys(biographicFactors).length > 0
        ? biographicFactors
        : undefined,
    geographicData:
      lat != null && lng != null
        ? {
            lat: Math.round(lat * 100) / 100,
            lng: Math.round(lng * 100) / 100,
          }
        : undefined,
    upstreamDeterminants,
    healthIssues,
  };

  return NextResponse.json(record);
}
