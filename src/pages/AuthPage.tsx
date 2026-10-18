import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/lib/backendClient";
import { LogIn, UserPlus, Shield, Eye, EyeOff, Mail, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { logActivity } from "@/lib/activityLogger";
import { ADMIN_EMAIL, isUserAdmin } from "@/lib/adminAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const emailSchema = z.string().trim().min(1, "Email is required").email("Invalid email address").max(255);
const passwordSchema = z.string().min(1, "Password is required").max(128);

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const AuthPage = () => {
  const { user, signOut, signIn, signInAsAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const [activeTab, setActiveTab] = useState(
    queryTab === "admin" || location.pathname === "/admin-login" ? "admin" : location.pathname === "/register" ? "register" : "login"
  );

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const [regForm, setRegForm] = useState({ fullName: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [regStep, setRegStep] = useState<"form" | "otp">("form");
  const [regOtp, setRegOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [adminEmail, setAdminEmail] = useState(ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => { errs[err.path[0] as string] = err.message; });
      setLoginErrors(errs);
      return;
    }

    // Do not allow admin to log in in the user login place
    if (isUserAdmin(loginEmail.trim())) {
      toast({
        title: "Admin Account Detected",
        description: "This login is for regular users only. Please use the Admin tab to log in as Administrator.",
        variant: "destructive",
      });
      setAdminEmail(loginEmail.trim());
      setActiveTab("admin");
      return;
    }

    setLoginLoading(true);

    const { error, isAdmin: userIsAdmin } = await signIn({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    setLoginLoading(false);

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    if (userIsAdmin) {
      await signOut();
      toast({
        title: "Admin Account Detected",
        description: "Administrators must log in via the Admin tab.",
        variant: "destructive",
      });
      setActiveTab("admin");
      return;
    }

    toast({ title: "Welcome back!" });
    void logActivity({ action: "login", entityType: "auth", details: "User logged in" });
    navigate("/dashboard", { replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors({});
    const result = registerSchema.safeParse(regForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => { errs[err.path[0] as string] = err.message; });
      setRegErrors(errs);
      return;
    }
    setRegLoading(true);
    const { error } = await backend.auth.requestRegisterOtp({
      email: regForm.email.trim(),
      password: regForm.password,
      fullName: regForm.fullName.trim(),
      phone: regForm.phone.trim(),
    });
    setRegLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      setRegStep("otp");
      setRegOtp("");
      setOtpError("");
      setResendCooldown(60);
      toast({
        title: "Verification Code Sent! 📩",
        description: `We've sent a 6-digit OTP code to ${regForm.email.trim()}. Please enter it to activate your account.`,
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const cleanOtp = regOtp.trim().replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    const { error } = await backend.auth.verifyRegisterOtp({
      email: regForm.email.trim(),
      otp: cleanOtp,
    });
    setOtpLoading(false);

    if (error) {
      setOtpError(error.message);
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Account Verified Successfully! 🎉",
      description: "Welcome to AK Buffaloes! Your account is active.",
    });
    void logActivity({ action: "register_verified", entityType: "auth", details: "User verified and registered" });
    navigate("/dashboard", { replace: true });
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    setRegLoading(true);
    const { error } = await backend.auth.requestRegisterOtp({
      email: regForm.email.trim(),
      password: regForm.password,
      fullName: regForm.fullName.trim(),
      phone: regForm.phone.trim(),
    });
    setRegLoading(false);
    if (error) {
      toast({ title: "Could not resend code", description: error.message, variant: "destructive" });
    } else {
      setResendCooldown(60);
      toast({
        title: "New Verification Code Sent! 📩",
        description: `Please check ${regForm.email.trim()} for your new 6-digit OTP code.`,
      });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErrors({});
    const rawEmail = adminEmail.trim();
    const effectiveEmail = rawEmail.toLowerCase() === "admin" ? ADMIN_EMAIL : rawEmail;
    const result = loginSchema.safeParse({ email: effectiveEmail, password: adminPassword });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => { errs[err.path[0] as string] = err.message; });
      setAdminErrors(errs);
      return;
    }

    // Do not allow regular user to log in in the admin login place
    if (!isUserAdmin(effectiveEmail)) {
      toast({
        title: "Access Denied",
        description: "This portal is for administrators only. Regular users cannot log in here. Please use the User Login tab.",
        variant: "destructive",
      });
      setLoginEmail(effectiveEmail);
      setActiveTab("login");
      return;
    }

    setAdminLoading(true);
    const { error, isAdmin: adminConfirmed } = await signInAsAdmin({
      email: effectiveEmail,
      password: adminPassword,
    });
    setAdminLoading(false);
    if (error) {
      toast({
        title: "Admin sign-in failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (!adminConfirmed) {
      await signOut();
      toast({
        title: "Access Denied",
        description: "This portal is for administrators only. Regular users cannot log in here. Please use User Login.",
        variant: "destructive",
      });
      setActiveTab("login");
      return;
    }

    toast({ title: "Welcome, Administrator!" });
    void logActivity({ action: "admin_login", entityType: "auth", details: "Admin logged in" });
    navigate("/admin", { replace: true });
  };

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs font-sans mt-0.5">{msg}</p> : null;

  return (
    <main className="pt-20 min-h-screen bg-cream flex items-center justify-center px-3 sm:px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm sm:max-w-md bg-background border border-border rounded-lg p-5 sm:p-8 shadow-sm"
      >
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t("auth.title")}</h1>
          <p className="font-sans text-muted-foreground mt-1.5 text-xs sm:text-sm">{t("auth.subtitle")}</p>
        </div>

        {user && (
          <div className="mb-4 p-2.5 rounded-lg bg-gold/15 border border-gold/40 text-xs font-sans flex items-center justify-between">
            <span className="truncate mr-2 text-foreground">Signed in as <strong>{user.email}</strong></span>
            <button
              type="button"
              onClick={async () => { await signOut(); toast({ title: "Signed out successfully" }); }}
              className="text-destructive font-bold hover:underline shrink-0 text-[11px]"
            >
              Sign Out
            </button>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setLoginErrors({});
            setRegErrors({});
            setAdminErrors({});
            setRegStep("form");
            setRegOtp("");
            setOtpError("");
          }}
          className="space-y-5 sm:space-y-6"
        >
          <TabsList className="w-full grid grid-cols-3 bg-muted/20 border border-border h-auto p-1">
            <TabsTrigger value="login" className="font-sans text-[10px] sm:text-sm gap-1 py-2">
              <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("auth.login")}
            </TabsTrigger>
            <TabsTrigger value="register" className="font-sans text-[10px] sm:text-sm gap-1 py-2">
              <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("auth.register")}
            </TabsTrigger>
            <TabsTrigger value="admin" className="font-sans text-[10px] sm:text-sm gap-1 py-2">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("auth.admin")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div>
                  <Input type="email" placeholder={t("auth.email")} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="font-sans h-10 sm:h-12 text-sm" maxLength={255} />
                  <ErrorText msg={loginErrors.email} />
                </div>
                <div>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder={t("auth.password")}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="font-sans h-10 sm:h-12 text-sm pr-10"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorText msg={loginErrors.password} />
                </div>
                <div className="flex items-center justify-end -mt-1 pb-1">
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password" + (loginEmail.trim() ? `?email=${encodeURIComponent(loginEmail.trim())}` : ""))}
                    className="font-sans text-xs text-gold hover:text-gold-light hover:underline transition-colors font-medium cursor-pointer"
                  >
                    {t("auth.forgotPassword") || "Forgot Password?"}
                  </button>
                </div>
                <Button type="submit" disabled={loginLoading} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full">
                  <LogIn className="w-4 h-4" />
                  {loginLoading ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            {regStep === "form" ? (
              <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                <div>
                  <Input placeholder={t("auth.fullName")} value={regForm.fullName} onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })} className="font-sans h-10 sm:h-12 text-sm" maxLength={100} />
                  <ErrorText msg={regErrors.fullName} />
                </div>
                <div>
                  <Input placeholder={t("auth.phone")} value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="font-sans h-10 sm:h-12 text-sm" maxLength={10} />
                  <ErrorText msg={regErrors.phone} />
                </div>
                <div>
                  <Input type="email" placeholder={t("auth.emailRequired")} value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className="font-sans h-10 sm:h-12 text-sm" maxLength={255} />
                  <ErrorText msg={regErrors.email} />
                </div>
                <div>
                  <div className="relative">
                    <Input
                      type={showRegPassword ? "text" : "password"}
                      placeholder={t("auth.passwordRequired")}
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="font-sans h-10 sm:h-12 text-sm pr-10"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorText msg={regErrors.password} />
                </div>
                <div>
                  <div className="relative">
                    <Input
                      type={showRegConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.confirmPassword")}
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      className="font-sans h-10 sm:h-12 text-sm pr-10"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ErrorText msg={regErrors.confirmPassword} />
                </div>
                <Button type="submit" disabled={regLoading} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full">
                  <Mail className="w-4 h-4" />
                  {regLoading ? "Sending Verification Code..." : "Verify Email & Register"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center p-3.5 rounded-lg bg-gold/10 border border-gold/30">
                  <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">Verify Your Email</h3>
                  <p className="font-sans text-xs text-muted-foreground mt-1">
                    Enter the 6-digit OTP code sent to:
                  </p>
                  <p className="font-sans text-xs font-semibold text-gold mt-0.5 truncate">
                    {regForm.email.trim()}
                  </p>
                </div>

                <div>
                  <label className="block text-center font-sans text-xs font-medium text-foreground mb-1.5">
                    6-Digit Verification OTP
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={regOtp}
                    onChange={(e) => {
                      setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                    }}
                    placeholder="123456"
                    className="font-mono text-center text-xl tracking-[10px] h-12 bg-background border-border"
                    autoFocus
                  />
                  {otpError && (
                    <p className="text-destructive text-xs font-sans mt-1.5 text-center font-medium">{otpError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={otpLoading || regOtp.length !== 6}
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-bold h-11 text-sm rounded-full gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {otpLoading ? "Verifying OTP..." : "Verify & Complete Registration"}
                </Button>

                <div className="pt-2 flex flex-col gap-2 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || regLoading}
                    className="font-sans text-xs text-gold hover:text-gold-light hover:underline disabled:opacity-50 disabled:no-underline font-medium inline-flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regLoading ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Verification Code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegStep("form"); setOtpError(""); }}
                    className="font-sans text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1 mt-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Edit registration details
                  </button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="admin">
            <div className="bg-muted/10 border border-border rounded-md p-2.5 sm:p-3 mb-3 sm:mb-4">
              <p className="font-sans text-[10px] sm:text-xs text-muted-foreground text-center">
                🔒 {t("auth.adminWarning")}
              </p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-3 sm:space-y-4">
              <div>
                <Input type="email" placeholder={t("auth.adminEmail")} value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="font-sans h-10 sm:h-12 text-sm" maxLength={255} autoComplete="username" />
                <ErrorText msg={adminErrors.email} />
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showAdminPassword ? "text" : "password"}
                    placeholder={t("auth.adminPassword")}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="font-sans h-10 sm:h-12 text-sm pr-10"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <ErrorText msg={adminErrors.password} />
              </div>
              <div className="flex items-center justify-end -mt-1 pb-1">
                <button
                  type="button"
                  onClick={() => navigate("/reset-password" + (adminEmail.trim() ? `?email=${encodeURIComponent(adminEmail.trim())}` : ""))}
                  className="font-sans text-xs text-gold hover:text-gold-light hover:underline transition-colors font-medium cursor-pointer"
                >
                  Forgot Admin Password?
                </button>
              </div>
              <Button type="submit" disabled={adminLoading} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 sm:h-12 gap-2 text-sm rounded-full">
                <Shield className="w-4 h-4" />
                {adminLoading ? t("auth.adminLoggingIn") : t("auth.adminLogin")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
};

export default AuthPage;
