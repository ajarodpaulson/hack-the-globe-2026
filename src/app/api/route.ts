import { NextRequest, NextResponse } from "next/server";
import { parseInterviewTranscript } from "./utils/interview-parsing";

type RequestBody = {
  ageRange?: string;
  gender?: string;
  lat?: number;
  lng?: number;
  transcript: string;
};

export async function POST(request: NextRequest) {
  const { ageRange, gender, lat, lng, transcript }: RequestBody = await request.json();

  if (!transcript) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 }
    );
  }

  const record = await parseInterviewTranscript({
    ageRange,
    gender,
    lat,
    lng,
    transcript,
  });

  return NextResponse.json(record);
}
