"use client";

import { Button } from "@heiso-io/bee/components/ui/button";
import LoadingSpinner from "@heiso-io/bee/components/primitives/spinner";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { generateOTP, type OTPMode, verifyOTP } from "../_server/otp.service";
import AuthRedirectHint from "./authRedirectHint";
import Header from "./header";
import { type LoginStep, LoginStepEnum } from "./loginForm";

interface OTPLoginFormProps {
  email?: string | null;
  setStep: (step: LoginStep) => void;
  loginMethod?: string | null;
  error: string;
  setError: (error: string) => void;
  handleLoginSuccess: () => void;
  /** Pass additional credentials to signIn (e.g., isDevLogin for admin access) */
  extraSignInParams?: Record<string, string>;
  /** OTP flow mode — "dev" 跳過 membership check 限 ALLOWED_DEV_EMAILS */
  mode?: OTPMode;
  /** 預填的驗證碼（從 magic link token 來，autoVerify 用）*/
  initialCode?: string;
  /** 進來自動觸發 verify（搭配 initialCode）*/
  autoVerify?: boolean;
}

/**
 * Magic-link-only OTP UI。
 *
 * - 從 /login 流到這裡（autoVerify=false, initialCode=空）→ 顯示「check email」+ resend
 * - 從 /auth/login/2steps?t=... 流到這裡（autoVerify=true, initialCode 有值）→ silent verify + redirect
 * - 沒有 manual OTP 輸入 UI（產品決定走 magic link only）
 */
export default function OTPLoginForm({
  email,
  setStep,
  error,
  setError,
  handleLoginSuccess,
  extraSignInParams,
  mode = "regular",
  initialCode = "",
  autoVerify = false,
}: OTPLoginFormProps) {
  const otpOpts = mode === "dev" ? { mode: "dev" as const } : undefined;
  const t = useTranslations("auth.otp");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { update } = useSession();
  const userEmail = email || "";

  // 驗證 OTP（autoVerify 路徑用）
  const handleVerifyOTP = async (code: string) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await verifyOTP(userEmail, code, otpOpts);

      if (!result.success) {
        const raw = result.message;
        if (raw && /^[a-z_]+$/.test(raw)) {
          setError(t(`error.${raw}`));
        } else {
          setError(raw ?? t("error.general"));
        }
        return;
      }

      if (result.success && result.memberId) {
        const signInResult = await signIn("credentials", {
          email: userEmail,
          otpVerified: "true",
          memberId: result.memberId,
          redirect: false,
          ...extraSignInParams,
        });

        if (signInResult?.ok) {
          await update();
          handleLoginSuccess();
        } else {
          setError(t("error.login"));
        }
      } else {
        setError(result.message ?? t("error.general"));
      }
    } catch (_err) {
      setError(t("error.general"));
    } finally {
      setIsLoading(false);
    }
  };

  // Magic link 點進來：autoVerify 一次（only once）
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    if (!autoVerify || !initialCode || !userEmail) return;
    autoRanRef.current = true;
    handleVerifyOTP(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVerify, initialCode, userEmail]);

  // 重新发送 magic link
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError("");
    setIsLoading(true);

    try {
      const result = await generateOTP(userEmail, otpOpts);
      if (result.success) {
        startCountdown();
      } else {
        setError(result.message);
      }
    } catch (_err) {
      setError(t("error.general"));
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 如果 autoVerify in flight → 顯示 verifying spinner（無 input UI）
  if (autoVerify && isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
        <LoadingSpinner className="h-8 w-8 text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("verifying", { defaultMessage: "Signing you in…" })}
        </p>
      </div>
    );
  }

  return (
    <>
      <Header
        title={t("title")}
        description={t("description", { email: email || "email" })}
      />

      <div className="mt-8 mb-8 space-y-6">
        <div className="rounded-xl border border-white/10 bg-background/30 p-6 text-center space-y-3">
          <p className="text-sm font-medium">
            {t("checkEmail", {
              defaultMessage: "We sent a sign-in link to your inbox.",
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("clickLinkToContinue", {
              defaultMessage: "Open the email and click the link to continue.",
            })}
          </p>
        </div>

        {error && (
          <p className="w-full text-sm text-destructive font-medium text-center">
            {error}
          </p>
        )}

        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={countdown > 0 || isLoading}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground/60"
          >
            {countdown > 0
              ? t("resend.countdown", { seconds: countdown })
              : t("resend.action")}
          </button>
        </div>
      </div>

      <AuthRedirectHint>
        <div className="flex justify-center">
          {t.rich("backToLogin", {
            Link: (chunks) => (
              <Button
                variant="link"
                className="text-muted-foreground hover:text-primary font-medium p-0 h-auto text-sm transition-colors"
                onClick={() => setStep(LoginStepEnum.Email)}
                type="button"
              >
                {chunks}
              </Button>
            ),
          })}
        </div>
      </AuthRedirectHint>
    </>
  );
}
