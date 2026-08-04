import { getEnvironment } from "@afyabridge/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const environment = getEnvironment();

  return NextResponse.json(
    {
      status: "ok",
      service: "afyabridge-web",
      environment: environment.APP_ENV,
      country: environment.APP_COUNTRY
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow"
      }
    }
  );
}
