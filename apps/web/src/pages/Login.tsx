import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const setAuth    = useAuthStore((s) => s.setAuth);
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await authApi.login({ email, password });
      const data = res.data.data;
      setAuth(data.user, data.tokens);
      navigate("/");
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(error.response?.data?.error?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 border-r border-white/5 flex-col justify-between p-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 flex items-center justify-center text-black font-black text-lg">
            F
          </div>
          <span className="text-white font-black text-xl tracking-tight">
            FLEET AI
          </span>
        </div>

        <div>
          <div className="text-6xl font-black text-white tracking-tighter leading-none mb-4">
            MANAGE<br/>
            <span className="text-amber-500">SMARTER.</span><br/>
            MOVE<br/>
            FASTER.
          </div>
          <p className="text-slate-500 font-mono text-sm max-w-xs">
            Real-time GPS fleet management. AI-powered driver assistance. Automated billing.
          </p>
        </div>

        <div className="flex gap-8">
          {["GPS TRACKING", "AI ASSISTANT", "AUTO BILLING"].map((f) => (
            <div key={f} className="text-xs font-mono text-slate-600 tracking-widest">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">
              SIGN IN
            </h1>
            <p className="text-slate-500 font-mono text-sm mt-1">
              Enter your fleet credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="manager@fleet.company"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center mt-2"
            >
              SIGN IN
            </Button>
          </form>

          <p className="text-center text-slate-600 font-mono text-xs mt-6">
            New organisation?{" "}
            <Link to="/register" className="text-amber-400 hover:text-amber-300">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}