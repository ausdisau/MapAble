import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle, LogIn, Loader2, HeartHandshake, Bus, Briefcase, Bot, ShieldCheck, UserPlus } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link } from "wouter";
import logoImage from "@assets/Accessible_Australia_Logo_Design_1772582762574.png";

export default function LoginPage() {
  const { login, isLoggingIn, loginError, auth0Enabled } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0F1A2E 0%, #14578F 50%, #1B6EB5 100%)" }}>
      <div className="flex h-[3px] shrink-0">
        <div className="flex-1" style={{ backgroundColor: "#2EAA6E" }} />
        <div className="flex-1" style={{ backgroundColor: "#1A4B7A" }} />
        <div className="flex-1" style={{ backgroundColor: "#E6A817" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img
                src={logoImage}
                alt="MapAble"
                className="w-20 h-20 rounded-2xl shadow-lg"
                data-testid="img-login-logo"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                <span style={{ color: "#E6A817" }}>MapAble</span>{" "}
                <span className="text-white/60 text-lg font-bold">4.0</span>
              </h1>
              <p className="text-white/60 text-sm mt-1 tracking-wide">Empowering Independence</p>
            </div>

            <div className="flex justify-center gap-6 pt-2">
              <div className="flex flex-col items-center gap-1">
                <HeartHandshake className="w-5 h-5 text-[#2EAA6E]" />
                <span className="text-[10px] text-white/50 font-medium">Care</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Bus className="w-5 h-5 text-[#2EAA6E]" />
                <span className="text-[10px] text-white/50 font-medium">Transport</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Briefcase className="w-5 h-5 text-[#2EAA6E]" />
                <span className="text-[10px] text-white/50 font-medium">Employment</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Bot className="w-5 h-5 text-[#2EAA6E]" />
                <span className="text-[10px] text-white/50 font-medium">AI Chat</span>
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6">
              <h2 className="text-lg font-semibold text-white text-center">Sign in to your account</h2>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5" data-testid="text-login-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Invalid username or password</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80 text-sm">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                    data-testid="input-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#2EAA6E] focus:ring-[#2EAA6E]/20 h-11"
                    data-testid="input-password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn || !username || !password}
                  className="w-full h-11 text-sm font-semibold"
                  style={{ backgroundColor: "#2EAA6E" }}
                  data-testid="button-login"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              {auth0Enabled && (
                <div className="mt-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/40 font-medium">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="space-y-2.5">
                    <a
                      href="/api/auth/auth0/login?connection=google-oauth2"
                      className="flex items-center justify-center gap-2.5 w-full h-11 rounded-md border border-white/15 bg-white/5 text-white text-sm font-medium transition-colors hover:bg-white/10"
                      data-testid="button-sso-google"
                    >
                      <SiGoogle className="w-4 h-4" />
                      Sign in with Google
                    </a>
                    <a
                      href="/api/auth/auth0/login?connection=windowslive"
                      className="flex items-center justify-center gap-2.5 w-full h-11 rounded-md border border-white/15 bg-white/5 text-white text-sm font-medium transition-colors hover:bg-white/10"
                      data-testid="button-sso-microsoft"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                      </svg>
                      Sign in with Microsoft
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-[11px] text-white/40 text-center mb-3">Demo Accounts</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setUsername("demo_participant"); setPassword("hashed_password"); }}
                    className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
                    data-testid="button-demo-participant"
                  >
                    <span className="font-medium text-white/80 block">Participant</span>
                    <span className="text-[10px]">Jordan Lee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsername("alex_m"); setPassword("hashed_password"); }}
                    className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
                    data-testid="button-demo-carer"
                  >
                    <span className="font-medium text-white/80 block">Carer</span>
                    <span className="text-[10px]">Alex Mehmet</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-white/50 text-sm hover:text-white/70 transition-colors"
              data-testid="link-create-account"
            >
              <UserPlus className="w-4 h-4" />
              Don't have an account? <span className="text-[#2EAA6E] font-medium">Create Account</span>
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
