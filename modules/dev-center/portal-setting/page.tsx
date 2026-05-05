"use client";

import { ActionButton } from "@heiso-io/bee/components/primitives/action-button";
import { LanguageSwitcher } from "@heiso-io/bee/components/primitives/language-switcher";
import { Card } from "@heiso-io/bee/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@heiso-io/bee/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@heiso-io/bee/components/ui/select";
import type { Locale } from "@heiso-io/bee/i18n/config";
import { defaultLocale, getLanguageInfo } from "@heiso-io/bee/i18n/config";
import { LogoImage } from "@heiso-io/bee/components/primitives/logo-image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  getGeneralSettings,
  saveDefaultLanguage,
  saveGeneralSetting,
} from "./portal-setting.service";

export const SystemOauth = {
  none: { name: "None", value: "none" },
  google: { name: "Google SSO", value: "google" },
  microsoft: { name: "Azure SSO", value: "microsoft" },
};

const settingsSchema = z.object({
  system_oauth: z.string().optional(),
  portal_logo: z.string().optional(),
  portal_favicon: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function PortalSettingPage() {
  const t = useTranslations("devCenter.settings");
  const [isLoading, startTransition] = useTransition();
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [currentLocale, setCurrentLocale] = useState<Locale | undefined>();

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getGeneralSettings();
      setSystemSettings(data);
    } catch (error) {
      console.error("Failed to fetch general settings", error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const locale = (systemSettings as any)?.language?.default as
      | Locale
      | undefined;
    setCurrentLocale(locale ?? defaultLocale);
  }, [systemSettings]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      system_oauth: systemSettings?.system_oauth ?? "none",
      portal_logo: systemSettings?.portal_logo ?? "",
      portal_favicon: systemSettings?.portal_favicon ?? "",
    },
  });

  useEffect(() => {
    if (!systemSettings) return;
    form.reset({
      system_oauth: systemSettings?.system_oauth ?? "none",
      portal_logo: systemSettings?.portal_logo ?? "",
      portal_favicon: systemSettings?.portal_favicon ?? "",
    });
  }, [systemSettings, form]);

  async function onSubmit(data: SettingsFormValues) {
    startTransition(async () => {
      await saveGeneralSetting(data);
      await fetchSettings();
      toast.success("Portal settings updated");
    });
  }

  return (
    <div className="container mx-auto max-w-5xl justify-start py-10 space-y-6 mb-15 px-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Portal Setting</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card/50 p-6">
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="system_oauth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("system_oauth.label")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(SystemOauth).map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portal_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <LogoImage
                        value={field.value}
                        onChange={(url) => field.onChange(url ?? "")}
                        fallback="/images/logo.png"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portal_favicon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon</FormLabel>
                    <FormControl>
                      <LogoImage
                        value={field.value}
                        onChange={(url) => field.onChange(url ?? "")}
                        fallback="/images/favicon.png"
                        className="h-12 w-12"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <ActionButton
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              {t("actions.save.button")}
            </ActionButton>
          </div>
        </form>
      </Form>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{t("language.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("language.description")}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">
                {t("language.default")}
              </span>
              <p className="text-xs text-muted-foreground">
                {t("language.default_description")}
              </p>
            </div>
            <div className="">
              <LanguageSwitcher
                className="border rounded-md w-48 h-12"
                lang={currentLocale}
                onChange={(value) => {
                  setCurrentLocale(value);
                  startTransition(async () => {
                    await saveDefaultLanguage(value);
                    await fetchSettings();
                    toast("Language settings saved");
                  });
                }}
              >
                {getLanguageInfo(currentLocale ?? defaultLocale)?.nativeName}
              </LanguageSwitcher>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
