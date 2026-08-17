import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  HeartHandshake,
  Briefcase,
  UserCheck,
  Loader2,
  Search,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import logoImage from "@assets/mapable-logo.svg";
import { Link, useLocation } from "wouter";

type Role = "participant" | "provider" | "carer";

interface LookupData {
  fullName: string;
  ndisNumber?: string;
  planStartDate?: string;
  planEndDate?: string;
  managementType?: string;
  abn?: string;
  businessName?: string;
  registrationGroups?: string[];
  screeningNumber?: string;
  clearanceStatus?: string;
  expiryDate?: string;
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [manualPlanStart, setManualPlanStart] = useState("");
  const [manualPlanEnd, setManualPlanEnd] = useState("");
  const [manualManagementType, setManualManagementType] = useState("");
  const [manualBusinessName, setManualBusinessName] = useState("");
  const [manualClearanceStatus, setManualClearanceStatus] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/auth/register", payload);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation("/");
    },
    onError: (error: Error) => {
      setRegisterError(error.message || "Registration failed");
    },
  });

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep(2);
    setLookupData(null);
    setIdentifier("");
    setLookupError("");
  };

  const handleLookup = async () => {
    if (!identifier.trim() || !role) return;
    setIsLookingUp(true);
    setLookupError("");
    try {
      let url = "";
      if (role === "participant") {
        url = `/api/ndis/lookup/participant/${encodeURIComponent(identifier.trim())}`;
      } else if (role === "provider") {
        url = `/api/ndis/lookup/provider/${encodeURIComponent(identifier.trim())}`;
      } else {
        url = `/api/ndis/lookup/worker/${encodeURIComponent(identifier.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Lookup failed");
      const data = await res.json();

      if (role === "participant") {
        setLookupData({
          fullName: data.fullName,
          ndisNumber: data.ndisNumber,
          planStartDate: data.planStartDate,
          planEndDate: data.planEndDate,
          managementType: data.managementType,
        });
        setFullName(data.fullName);
      } else if (role === "provider") {
        setLookupData({
          fullName: data.businessName,
          abn: data.abn,
          businessName: data.businessName,
          registrationGroups: data.registrationGroups,
        });
        setFullName(data.businessName);
      } else {
        setLookupData({
          fullName: data.fullName,
          screeningNumber: data.screeningNumber,
          clearanceStatus: data.clearanceStatus,
          expiryDate: data.expiryDate,
        });
        setFullName(data.fullName);
      }
      setStep(3);
    } catch {
      setLookupError("Could not find NDIS records. You can continue with manual entry.");
      setLookupData(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSkipLookup = () => {
    if (!identifier.trim()) {
      setLookupError("Please enter your NDIS identifier to continue.");
      return;
    }
    setLookupData(null);
    setStep(3);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setRegisterError("Password must be at least 6 characters");
      return;
    }

    const payload: Record<string, unknown> = {
      username,
      password,
      fullName: fullName || "New User",
      email,
      role: role!,
      ndisNumber: lookupData?.ndisNumber || (role === "participant" ? identifier : undefined),
      planStartDate: lookupData?.planStartDate || manualPlanStart || undefined,
      planEndDate: lookupData?.planEndDate || manualPlanEnd || undefined,
      managementType: lookupData?.managementType || manualManagementType || undefined,
      abn: lookupData?.abn || (role === "provider" ? identifier : undefined),
      providerBusinessName: lookupData?.businessName || manualBusinessName || undefined,
      providerRegistrationGroups: lookupData?.registrationGroups,
      screeningNumber: lookupData?.screeningNumber || (role === "carer" ? identifier : undefined),
      screeningClearanceStatus: lookupData?.clearanceStatus || manualClearanceStatus || undefined,
      screeningExpiry: lookupData?.expiryDate,
      workerTitle: role === "carer" ? "Support Worker" : undefined,
    };

    registerMutation.mutate(payload);
  };

  const roleCards = [
    {
      role: "participant" as Role,
      title: "Participant",
      description: "I receive NDIS-funded support services",
      icon: HeartHandshake,
      color: "#2EAA6E",
    },
    {
      role: "provider" as Role,
      title: "Provider",
      description: "I provide disability support services",
      icon: Briefcase,
      color: "#E6A817",
    },
    {
      role: "carer" as Role,
      title: "Support Worker",
      description: "I work as an NDIS support worker",
      icon: UserCheck,
      color: "#14578F",
    },
  ];

  const getIdentifierLabel = () => {
    if (role === "participant") return "NDIS Number";
    if (role === "provider") return "ABN / NDIS Provider Number";
    return "NDIS Worker Screening Number";
  };

  const getIdentifierPlaceholder = () => {
    if (role === "participant") return "e.g. 431234567";
    if (role === "provider") return "e.g. 12345678901";
    return "e.g. WSC12345678";
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #0F1A2E 0%, #14578F 50%, #1B6EB5 100%)",
      }}
    >
      <div className="flex h-[3px] shrink-0">
        <div className="flex-1" style={{ backgroundColor: "#2EAA6E" }} />
        <div className="flex-1" style={{ backgroundColor: "#1A4B7A" }} />
        <div className="flex-1" style={{ backgroundColor: "#E6A817" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img
                src={logoImage}
                alt="MapAble — Empowering Independence"
                className="h-16 w-auto max-w-[160px] object-contain"
                data-testid="img-register-logo"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                <span style={{ color: "#E6A817" }}>MapAble</span>{" "}
                <span className="text-white/60 text-base font-bold">4.0</span>
              </h1>
              <p className="text-white/60 text-sm mt-1">Create your account</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s
                      ? "bg-[#2EAA6E] text-white"
                      : step === s
                        ? "bg-white/20 text-white border-2 border-[#2EAA6E]"
                        : "bg-white/10 text-white/40"
                  }`}
                  data-testid={`step-indicator-${s}`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 ${step > s ? "bg-[#2EAA6E]" : "bg-white/20"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-3 pt-5 px-6">
              <h2 className="text-lg font-semibold text-white text-center">
                {step === 1 && "Select your role"}
                {step === 2 && "Verify your NDIS details"}
                {step === 3 && "Complete your profile"}
              </h2>
              <p className="text-white/50 text-xs text-center mt-1">
                {step === 1 && "Choose how you'll use MapAble"}
                {step === 2 && "We'll look up your information automatically"}
                {step === 3 && "Review and set your login credentials"}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {step === 1 && (
                <div className="space-y-3">
                  {roleCards.map((card) => (
                    <button
                      key={card.role}
                      onClick={() => handleRoleSelect(card.role)}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                      data-testid={`button-role-${card.role}`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: card.color + "20" }}
                      >
                        <card.icon className="w-5 h-5" style={{ color: card.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{card.title}</div>
                        <div className="text-xs text-white/50">{card.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">{getIdentifierLabel()}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={getIdentifierPlaceholder()}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11 flex-1"
                        data-testid="input-ndis-identifier"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLookup();
                          }
                        }}
                      />
                      <Button
                        onClick={handleLookup}
                        disabled={!identifier.trim() || isLookingUp}
                        className="h-11 px-4"
                        style={{ backgroundColor: "#2EAA6E" }}
                        data-testid="button-lookup"
                      >
                        {isLookingUp ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {lookupError && (
                    <div
                      className="flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5"
                      data-testid="text-lookup-warning"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{lookupError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setStep(1); setRole(null); }}
                      className="flex-1 h-10 border-white/20 text-white/70 bg-transparent hover:bg-white/10"
                      data-testid="button-back-step1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleSkipLookup}
                      variant="outline"
                      className="flex-1 h-10 border-white/20 text-white/70 bg-transparent hover:bg-white/10"
                      data-testid="button-skip-lookup"
                    >
                      Skip & enter manually
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {lookupData && (
                    <div className="bg-[#2EAA6E]/10 border border-[#2EAA6E]/30 rounded-lg p-3 space-y-2" data-testid="section-lookup-results">
                      <div className="flex items-center gap-2 text-[#2EAA6E] text-xs font-semibold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        NDIS Verified Data
                      </div>
                      {lookupData.fullName && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Name: </span>
                          {lookupData.fullName}
                        </div>
                      )}
                      {lookupData.ndisNumber && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">NDIS #: </span>
                          {lookupData.ndisNumber}
                        </div>
                      )}
                      {lookupData.planStartDate && lookupData.planEndDate && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Plan: </span>
                          {lookupData.planStartDate} to {lookupData.planEndDate}
                        </div>
                      )}
                      {lookupData.managementType && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Management: </span>
                          {lookupData.managementType.replace(/_/g, " ")}
                        </div>
                      )}
                      {lookupData.abn && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">ABN: </span>
                          {lookupData.abn}
                        </div>
                      )}
                      {lookupData.businessName && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Business: </span>
                          {lookupData.businessName}
                        </div>
                      )}
                      {lookupData.registrationGroups && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Groups: </span>
                          {lookupData.registrationGroups.join(", ")}
                        </div>
                      )}
                      {lookupData.clearanceStatus && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Clearance: </span>
                          <span className={lookupData.clearanceStatus === "cleared" ? "text-[#2EAA6E]" : "text-amber-400"}>
                            {lookupData.clearanceStatus}
                          </span>
                        </div>
                      )}
                      {lookupData.expiryDate && (
                        <div className="text-xs text-white/70">
                          <span className="text-white/40">Expires: </span>
                          {lookupData.expiryDate}
                        </div>
                      )}
                    </div>
                  )}

                  {!lookupData && role === "participant" && (
                    <div className="space-y-3 border border-white/10 rounded-lg p-3">
                      <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">NDIS Plan Details (Optional)</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-white/60 text-xs">Plan Start Date</Label>
                          <Input
                            type="date"
                            value={manualPlanStart}
                            onChange={(e) => setManualPlanStart(e.target.value)}
                            className="bg-white/10 border-white/20 text-white h-9 text-sm"
                            data-testid="input-manual-plan-start"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-white/60 text-xs">Plan End Date</Label>
                          <Input
                            type="date"
                            value={manualPlanEnd}
                            onChange={(e) => setManualPlanEnd(e.target.value)}
                            className="bg-white/10 border-white/20 text-white h-9 text-sm"
                            data-testid="input-manual-plan-end"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Management Type</Label>
                        <select
                          value={manualManagementType}
                          onChange={(e) => setManualManagementType(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md h-9 text-sm px-3"
                          data-testid="select-management-type"
                        >
                          <option value="">Select...</option>
                          <option value="self_managed">Self Managed</option>
                          <option value="plan_managed">Plan Managed</option>
                          <option value="ndia_managed">NDIA Managed</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {!lookupData && role === "provider" && (
                    <div className="space-y-3 border border-white/10 rounded-lg p-3">
                      <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">Provider Details (Optional)</div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Business Name</Label>
                        <Input
                          value={manualBusinessName}
                          onChange={(e) => setManualBusinessName(e.target.value)}
                          placeholder="Your registered business name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
                          data-testid="input-manual-business-name"
                        />
                      </div>
                    </div>
                  )}

                  {!lookupData && role === "carer" && (
                    <div className="space-y-3 border border-white/10 rounded-lg p-3">
                      <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">Worker Screening (Optional)</div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Clearance Status</Label>
                        <select
                          value={manualClearanceStatus}
                          onChange={(e) => setManualClearanceStatus(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md h-9 text-sm px-3"
                          data-testid="select-clearance-status"
                        >
                          <option value="">Select...</option>
                          <option value="cleared">Cleared</option>
                          <option value="pending">Pending</option>
                          <option value="conditional">Conditional</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {registerError && (
                    <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5" data-testid="text-register-error">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Full Name</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                      data-testid="input-fullname"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Username</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      required
                      minLength={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                      data-testid="input-register-username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                      data-testid="input-register-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      minLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                      data-testid="input-register-confirm-password"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="h-11 border-white/20 text-white/70 bg-transparent hover:bg-white/10"
                      data-testid="button-back-step2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending || !username || !password || !email || !fullName}
                      className="flex-1 h-11 text-sm font-semibold"
                      style={{ backgroundColor: "#2EAA6E" }}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/login"
              className="text-white/50 text-sm hover:text-white/70 transition-colors"
              data-testid="link-back-to-login"
            >
              Already have an account? <span className="text-[#2EAA6E] font-medium">Sign in</span>
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2EAA6E]/60" />
              <span>NDIS Registered Provider</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
