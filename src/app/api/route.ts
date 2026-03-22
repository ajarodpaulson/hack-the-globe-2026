import { NextRequest, NextResponse } from "next/server";
import { parseInterviewTranscript } from "./utils/interview-parsing";

type RequestBody = {
  ageRange?: string;
  gender?: string;
  transcript: string;
};

export async function POST(request: NextRequest) {
  const { ageRange, gender, transcript }: RequestBody = await request.json();

  if (!transcript) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 }
    );
  }

  const record = await parseInterviewTranscript({
    ageRange,
    gender,
    transcript,
  });

  return NextResponse.json(record);
}
