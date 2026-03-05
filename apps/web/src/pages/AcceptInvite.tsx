import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Button, Input } from "../components/ui";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/accept-invite", { token, password });
      const data = res.data.data;
      setAuth(data.user, data.tokens);
      toast.success("Welcome to Fleet AI!");
      navigate("/");
    } catch (err: unknown) {
      const errorObj = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(errorObj.response?.data?.error?.message ?? "Invalid or expired invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black">
            F
          </div>
          <span className="text-white font-black text-lg">FLEET AI</span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">ACCEPT INVITATION</h1>
        <p className="text-slate-500 font-mono text-sm mb-8">
          Set your password to activate your account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            required
          />
          <Button type="submit" loading={loading} className="w-full justify-center mt-2">
            ACTIVATE ACCOUNT
          </Button>
        </form>
      </div>
    </div>
  );
}
