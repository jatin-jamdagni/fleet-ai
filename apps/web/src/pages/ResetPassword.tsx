import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Button, Input } from "../components/ui";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [email, setEmail] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setRequested(true);
      toast.success("Check your email for a reset link");
    } catch {
      toast.success("Check your email for a reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      toast.success("Password reset! Please sign in.");
      navigate("/login");
    } catch (err: unknown) {
      const errorObj = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(errorObj.response?.data?.error?.message ?? "Reset failed or link expired");
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black">
              F
            </div>
            <span className="text-white font-black text-lg">FLEET AI</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">NEW PASSWORD</h1>
          <form onSubmit={handleReset} className="flex flex-col gap-4 mt-8">
            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full justify-center">
              SET NEW PASSWORD
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black">
            F
          </div>
          <span className="text-white font-black text-lg">FLEET AI</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">RESET PASSWORD</h1>
        {requested ? (
          <p className="text-emerald-400 font-mono text-sm mt-4">Check your email for a reset link</p>
        ) : (
          <form onSubmit={handleRequest} className="flex flex-col gap-4 mt-8">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full justify-center">
              SEND RESET LINK
            </Button>
          </form>
        )}
        <p className="text-slate-600 font-mono text-xs mt-6 text-center">
          <Link to="/login" className="hover:text-slate-400">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
