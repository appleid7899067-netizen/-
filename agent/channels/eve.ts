import { eveChannel } from "eve/channels/eve";
import { localDev, type AuthFn, UnauthenticatedError } from "eve/channels/auth";

const supabaseAuth: AuthFn<Request> = async (request) => {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string; app_metadata?: { provider?: string } };
  if (!user.id || !user.email?.toLowerCase().endsWith("@gmail.com")) {
    throw new UnauthenticatedError({ code: "gmail_account_required", message: "ใช้บัญชี Gmail เพื่อเข้าใช้งาน" });
  }
  if (user.app_metadata?.provider && user.app_metadata.provider !== "google") {
    throw new UnauthenticatedError({ code: "google_oauth_required", message: "กรุณาเข้าสู่ระบบด้วย Google OAuth" });
  }

  return {
    attributes: { email: user.email, providerId: "google" },
    authenticator: "supabase-google",
    principalId: user.id,
    principalType: "user",
  };
};

export default eveChannel({ auth: [supabaseAuth, localDev()] });
