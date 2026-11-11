import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (!packageName || fingerprints.length === 0) {
    return NextResponse.json([])
  }

  return NextResponse.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ])
}
