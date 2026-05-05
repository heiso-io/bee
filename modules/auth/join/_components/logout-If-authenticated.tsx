"use client";

import { Button } from "@bee/core/components/ui/button";
import Header from "@bee/core/modules/auth/_components/header";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

export function LogoutIfAuthenticated() {
  const t = useTranslations("auth.signup");
  return (
    <>
      <Header title={t("title")} className="mb-0" />
      <p className="whitespace-pre-line text-center">{t("logout")}</p>

      <Button onClick={() => signOut()}>Logout</Button>
    </>
  );
}
