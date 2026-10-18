import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/lib/backendClient";
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Shield,
  ShieldCheck,
  RefreshCw,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { voiceAnnouncer } from "@/lib/voiceAnnouncer";
import { useLanguage } from "@/contexts/LanguageContext";
import { isUserAdmin } from "@/lib/adminAuth";

type ResetStep = "request_link" | "link_sent" | "reset_password" | "verify_otp" | "success";

const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const urlEmail = searchParams.get("email") || "";
  const urlToken = searchParams.get("token") || "";

  // Step state
  const [step, setStep] = useState<ResetStep>(() => {
    return urlToken ? "reset_password" : "request_link";
  });

  // Request link form
  const [email, setEmail] = useState(urlEmail);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  // New password form
  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [sendingOtp, setSendingOtp] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If URL changes with token, switch to reset_password
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      if (urlEmail) setEmail(urlEmail);
      setStep("reset_password");
    }
  }, [urlToken, urlEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first OTP box when entering verify_otp step
  useEffect(() => {
    if (step === "verify_otp") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Send Reset Password Email (only link button, NO OTP)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setRequestError(validation.error.errors[0]?.message || "Invalid email address");
      return;
    }

    setRequestLoading(true);

    const { error } = await backend.auth.requestPasswordReset({
      email: email.trim().toLowerCase(),
      origin: window.location.origin,
    });

    setRequestLoading(false);

    if (error) {
      setRequestError(error.message);
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    voiceAnnouncer.speak("Password reset link has been sent to your email.");
    toast({
      title: "Email Sent!",
      description: `We've sent a password reset email to ${email.trim()}`,
    });
    setStep("link_sent");
    setResendCooldown(45);
  };

  // Step 2: Validate New Password and SEND OTP to email
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    const errs: Record<string, string> = {};
    const emailVal = emailSchema.safeParse(email);
    if (!emailVal.success) {
      errs.email = emailVal.error.errors[0]?.message || "Invalid email";
    }

    const passVal = passwordSchema.safeParse(newPassword);
    if (!passVal.success) {
      errs.newPassword = passVal.error.errors[0]?.message || "Password must be at least 8 characters with numbers";
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setSendingOtp(true);

    // Now send the verification OTP to user's email
    const { data, error } = await backend.auth.sendResetOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
    });

    setSendingOtp(false);

    if (error) {
      toast({
        title: "Could not send OTP",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data?.token) {
      setToken(data.token);
    }

    setResendCooldown(45);
    voiceAnnouncer.speak("A 6-digit verification code has been sent to your email. Please enter it below.");
    toast({
      title: "OTP Sent to Your Email",
      description: `Enter the 6-digit verification code sent to ${email.trim()}`,
    });
    setStep("verify_otp");
  };

  // OTP Box inputs handler
  const handleOtpChange = (index: number, val: string) => {
    setOtpError("");
    const sanitized = val.replace(/\D/g, "");

    // Handling paste of complete 6-digit code
    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      chars.forEach((c, idx) => {
        newDigits[idx] = c;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = sanitized;
    setOtpDigits(newDigits);

    // Auto-focus next box
    if (sanitized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setOtpError("");

    const { error } = await backend.auth.sendResetOtp({
      email: email.trim().toLowerCase(),
    });

    setResendingOtp(false);

    if (error) {
      setOtpError(error.message);
      toast({
        title: "Could not resend OTP",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setResendCooldown(60);
    voiceAnnouncer.speak("A fresh 6-digit OTP has been sent to your email.");
    toast({
      title: "OTP Resent",
      description: `A fresh 6-digit verification code was sent to ${email}`,
    });
  };

  // Step 3: Verify OTP and finalize reset
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    const fullOtp = otpDigits.join("").trim();
    if (fullOtp.length < 6) {
      setOtpError("Please enter all 6 digits of your OTP code.");
      return;
    }

    setOtpLoading(true);

    const { error } = await backend.auth.verifyResetPassword({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      otp: fullOtp,
      newPassword,
    });

    setOtpLoading(false);

    if (error) {
      setOtpError(error.message);
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    voiceAnnouncer.speak("Your password has been successfully reset! You can now log in with your new password.");
    setStep("success");
    toast({
      title: "Password Updated!",
      description: "You can now log in with your new password.",
    });
  };

  const fullOtpEntered = otpDigits.every((d) => d !== "");

  return (
    <main className="pt-20 min-h-screen bg-cream flex items-center justify-center px-3 sm:px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm sm:max-w-md bg-background border border-border rounded-lg p-5 sm:p-8 shadow-sm"
      >
        {/* Brand Emblem */}
        <div className="flex justify-center mb-3">
          <Link to="/" className="group" aria-label="AK Buffaloes Home">
            <img
              src="/ak-buffalo-logo-emblem.png"
              alt="AK Buffaloes"
              className="h-14 w-14 rounded-full border-2 border-gold/60 shadow-md bg-black/40 p-0.5 group-hover:border-gold transition-colors object-contain"
            />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────────
              STAGE 1: REQUEST RESET LINK & OTP
          ───────────────────────────────────────────────────────────── */}
          {step === "request_link" && (
            <motion.div
              key="step-request"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-5 sm:mb-6">
                <div className="inline-flex p-2.5 rounded-full bg-gold/15 text-gold mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {t("auth.forgotTitle") || "Forgot Password"}
                </h1>
                <p className="font-sans text-muted-foreground mt-1.5 text-xs sm:text-sm">
                  {t("auth.forgotSubtitle") ||
                    "Enter your registered email to receive a password reset link and OTP."}
                </p>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-3.5 sm:space-y-4">
                <div>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder={t("auth.email")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setRequestError("");
                      }}
                      className="font-sans h-10 sm:h-12 text-sm pl-9"
                      maxLength={255}
                      autoFocus
                      required
                    />
                  </div>
                  {requestError && (
                    <p className="text-destructive text-xs font-sans mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {requestError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={requestLoading || !email.trim()}
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full transition-all"
                >
                  {requestLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t("auth.sendingReset") || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {t("auth.sendResetLink") || "Send Reset Link"}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    User Login
                  </Link>
                  <span className="text-muted-foreground/30 text-xs">•</span>
                  <Link
                    to="/auth?tab=admin"
                    className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Login
                  </Link>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 1.5: EMAIL SENT CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
          {step === "link_sent" && (
            <motion.div
              key="step-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Check Your Email</h1>
              <p className="font-sans text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">
                We sent a password reset email to:
              </p>
              <p className="font-mono text-xs sm:text-sm font-semibold text-foreground bg-muted/40 py-1.5 px-3 rounded-md mt-1 mb-4 inline-block break-all border border-border">
                {email}
              </p>

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-left mb-5 space-y-1.5">
                <p className="font-sans text-xs text-foreground font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  What to do next:
                </p>
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed pl-3.5">
                  1. Click the <strong className="text-foreground">Reset Password</strong> button in your email to open the reset form.
                </p>
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed pl-3.5">
                  2. Enter your new password and submit to receive your <strong className="text-foreground">6-Digit Verification OTP</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                <Button
                  type="button"
                  onClick={() => setStep("reset_password")}
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 text-sm rounded-full gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Enter New Password
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={resendCooldown > 0 || requestLoading}
                  onClick={handleRequestReset}
                  className="w-full font-sans text-xs h-9 rounded-full gap-1.5"
                >
                  {resendCooldown > 0
                    ? `Resend Email in ${resendCooldown}s`
                    : "Didn't receive email? Resend"}
                </Button>
              </div>

              <div className="mt-4 pt-2 border-t border-border/60 flex items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  User Login
                </Link>
                <span className="text-muted-foreground/30 text-xs">•</span>
                <Link
                  to="/auth?tab=admin"
                  className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Login
                </Link>
              </div>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 2: ENTER NEW PASSWORD & CONFIRM PASSWORD
          ───────────────────────────────────────────────────────────── */}
          {step === "reset_password" && (
            <motion.div
              key="step-reset"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-5 sm:mb-6">
                <div className="inline-flex p-2.5 rounded-full bg-gold/15 text-gold mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {t("auth.resetTitle") || "Reset Password"}
                </h1>
                <p className="font-sans text-muted-foreground mt-1.5 text-xs sm:text-sm">
                  {t("auth.resetSubtitle") || "Enter your new password below"}
                </p>
                {email && (
                  <p className="font-sans text-[11px] text-gold mt-1 font-medium">
                    Account: {email}
                  </p>
                )}
              </div>

              <form onSubmit={handleProceedToOtp} className="space-y-3 sm:space-y-4">
                {/* Email address field if not prefilled */}
                {!urlEmail && (
                  <div>
                    <label className="block font-sans text-xs text-muted-foreground mb-1">
                      {t("auth.email")}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
                      <Input
                        type="email"
                        placeholder={t("auth.email")}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setPasswordErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className="font-sans h-10 sm:h-12 text-sm pl-9"
                        maxLength={255}
                        required
                      />
                    </div>
                    {passwordErrors.email && (
                      <p className="text-destructive text-xs font-sans mt-1">
                        {passwordErrors.email}
                      </p>
                    )}
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">
                    {t("auth.newPassword") || "New Password"}
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder={t("auth.newPasswordPlaceholder") || "New Password (min 8 characters)"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                      }}
                      className="font-sans h-10 sm:h-12 text-sm pr-10"
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-destructive text-xs font-sans mt-1">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-sans text-xs text-muted-foreground mb-1">
                    {t("auth.confirmPassword") || "Confirm Password"}
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.confirmPasswordPlaceholder") || "Confirm New Password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      className="font-sans h-10 sm:h-12 text-sm pr-10"
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-destructive text-xs font-sans mt-1">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Requirements note */}
                <div className="bg-muted/30 border border-border/80 rounded-md p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-[11px]">Password Requirements:</p>
                  <p className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? "bg-emerald-500" : "bg-muted-foreground/60"}`} />
                    At least 8 characters
                  </p>
                  <p className={`flex items-center gap-1.5 ${/\d/.test(newPassword) ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(newPassword) ? "bg-emerald-500" : "bg-muted-foreground/60"}`} />
                    Contains at least one number
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!newPassword || !confirmPassword || sendingOtp}
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full transition-all"
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      {t("auth.resetPassword") || "Reset Password"}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("request_link")}
                    className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Request new link
                  </button>
                  <Link
                    to="/login"
                    className="font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                  >
                    {t("auth.backToLogin") || "Back to login"}
                  </Link>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 3: EMAIL OTP VERIFICATION
          ───────────────────────────────────────────────────────────── */}
          {step === "verify_otp" && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-5 sm:mb-6">
                <div className="inline-flex p-2.5 rounded-full bg-gold/15 text-gold mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {t("auth.otpTitle") || "Verify Email OTP"}
                </h1>
                <p className="font-sans text-muted-foreground mt-1.5 text-xs sm:text-sm">
                  {t("auth.otpSubtitle") || "Enter the 6-digit code sent to your email"}
                </p>
                <p className="font-mono text-xs font-semibold text-gold mt-1">
                  {email}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                {/* 6 Discrete OTP Input Boxes */}
                <div>
                  <div className="flex justify-between items-center gap-1.5 sm:gap-2 max-w-[320px] mx-auto">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 sm:w-12 h-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-lg border border-border focus:border-gold focus:ring-2 focus:ring-gold/30 bg-muted/20 outline-none transition-all text-foreground"
                        aria-label={`OTP Digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-destructive text-xs font-sans mt-2.5 text-center flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {otpError}
                    </p>
                  )}
                </div>

                {/* Resend OTP button */}
                <div className="text-center">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resendingOtp}
                    onClick={handleResendOtp}
                    className="font-sans text-xs text-gold hover:text-gold-light hover:underline disabled:text-muted-foreground disabled:no-underline font-medium transition-colors"
                  >
                    {resendingOtp
                      ? "Sending fresh code..."
                      : resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : t("auth.resendOtp") || "Didn't receive code? Resend OTP"}
                  </button>
                </div>

                {/* Submit OTP */}
                <Button
                  type="submit"
                  disabled={otpLoading || !fullOtpEntered}
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full transition-all"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t("auth.verifyingOtp") || "Verifying OTP..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t("auth.verifyAndReset") || "Verify OTP & Update Password"}
                    </>
                  )}
                </Button>

                {/* Return to edit password */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("reset_password")}
                    className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground hover:text-gold transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change New Password
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STAGE 4: SUCCESS CONFIRMATION
          ───────────────────────────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-2"
            >
              <div className="inline-flex p-3 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-3">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {t("auth.passwordUpdated") || "Password Updated!"}
              </h1>
              <p className="font-sans text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                {t("auth.passwordUpdatedDesc") ||
                  "Your password has been successfully reset. You can now login with your new password."}
              </p>

              <div className="mt-6">
                {isUserAdmin(email) ? (
                  <Button
                    type="button"
                    onClick={() => navigate("/auth?tab=admin")}
                    className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    Sign In to Admin Portal
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => navigate(`/login?email=${encodeURIComponent(email)}`)}
                    className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    {t("auth.goToLogin") || "Go to Login"}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
