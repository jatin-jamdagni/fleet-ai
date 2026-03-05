import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { authApi } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Input, Button } from "../components/ui";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function Register() {
    const [form, setForm] = useState({
        tenantName: "",
        tenantSlug: "",
        name: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();

    const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (k === "tenantSlug") val = val.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        setForm((f) => ({ ...f, [k]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authApi.register(form);
            const data = res.data.data;
            setAuth(data.user, data.tokens);
            toast.success("Organisation created!");
            navigate("/");
        } catch (err: unknown) {
            const error = err as AxiosError<{ error?: { message?: string } }>;
            toast.error(error.response?.data?.error?.message ?? "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                <Link
                    to="/login"
                    className="text-xs font-mono text-slate-600 hover:text-slate-400 mb-8 inline-flex items-center gap-2"
                >
                    ← Back to login
                </Link>

                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-amber-500 flex items-center justify-center text-black font-black">
                            F
                        </div>
                        <span className="text-white font-black text-lg">FLEET AI</span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        CREATE ORGANISATION
                    </h1>
                    <p className="text-slate-500 font-mono text-sm mt-1">
                        Set up your fleet management account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Organisation Name"
                        placeholder="Acme Logistics"
                        value={form.tenantName}
                        onChange={setField("tenantName")}
                        required
                    />
                    <Input
                        label="Organisation Slug"
                        placeholder="acme-logistics"
                        value={form.tenantSlug}
                        onChange={setField("tenantSlug")}
                        required
                    />
                    <div className="border-t border-white/5 my-1" />
                    <Input
                        label="Your Full Name"
                        placeholder="Fleet Manager"
                        value={form.name}
                        onChange={setField("name")}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={setField("email")}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Min 8 characters"
                        value={form.password}
                        onChange={setField("password")}
                        required
                        minLength={8}
                    />

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full justify-center mt-2"
                    >
                        CREATE ORGANISATION
                    </Button>
                </form>
            </div>
        </div>
    );
}