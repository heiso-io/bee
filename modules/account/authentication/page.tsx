import { auth } from "@bee/core/modules/auth/auth.config";
import { redirect } from "next/navigation";
import { cachedGetAccountByEmail } from "@bee/core/lib/cache/account";
import AuthenticationForm from "./authentication-form";

export default async function AuthenticationPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/auth/login");
    }

    const user = await cachedGetAccountByEmail(session.user.email);

    const loginMethod = user?.loginMethod || "email";

    return <AuthenticationForm loginMethod={loginMethod} />;
}
