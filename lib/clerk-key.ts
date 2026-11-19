import { publishableKeyFromHost } from "@clerk/shared/keys"

const CUSTOM_DOMAIN = "mjflashycardcourse.com"

export function requestHost(
  get: (name: string) => string | null,
) {
  return get("x-forwarded-host") ?? get("host")
}

export function publishableKeyForHost(host: string | null) {
  const configured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!host || configured?.startsWith("pk_test_")) {
    return configured
  }

  const hostname = host.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "")
  const apex = hostname?.replace(/^www\./, "")
  if (apex !== CUSTOM_DOMAIN) {
    return configured
  }

  return publishableKeyFromHost(apex, configured)
}
