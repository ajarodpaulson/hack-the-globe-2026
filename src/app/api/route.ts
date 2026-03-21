import { NextRequest, NextResponse } from "next/server";
import { maskPII } from "./utils/interveiw-parsing";

type RequestBody = {
  ageRange: string;
    gender: string;
    lat: number;
    lng: number;
    transcript: string;
};

export async function POST(request: NextRequest) {
  const { ageRange, gender, lat, lng, transcript }: RequestBody = await request.json();

  const maskedText = await maskPII(transcript);

  return NextResponse.json({ message: "Success", maskedText });
}
