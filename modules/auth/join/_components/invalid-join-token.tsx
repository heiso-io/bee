"use client";

import { Button } from "@heiso-io/bee/components/ui/button";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

export function InvalidJoinToken() {
  const t = useTranslations("auth.join");
  return (
    <>
      <p>{t("error.expiredLink")}</p>
      <Button
        onClick={() => {
          signOut({ callbackUrl: "/auth/login" });
        }}
      >
        {t("action.reLogin")}
      </Button>
    </>
  );
}
