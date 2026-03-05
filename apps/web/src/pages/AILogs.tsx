import { useQuery } from "@tanstack/react-query";
import { aiApi } from "../lib/api";
import { Badge, Table } from "../components/ui";

export default function AILogs() {
  const { data: health } = useQuery({
    queryKey: ["ai-health"],
    queryFn:  () => aiApi.health().then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ["ai-logs"],
    queryFn:  () => aiApi.logs().then((r) => r.data),
  });

  const logs = logsRes?.data ?? [];

  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">AI ASSISTANT</h1>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Driver interaction logs — {logsRes?.meta?.total ?? 0} queries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            health?.available
              ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
              : "bg-red-500"
          }`} />
          <span className="text-xs font-mono text-slate-500">
            {health?.provider?.toUpperCase() ?? "—"} ENGINE
          </span>
          {health && (
            <div className="flex gap-2">
              <Badge color={health.embedTest ? "green" : "red"}>
                {health.embedTest ? "EMBED OK" : "EMBED ERR"}
              </Badge>
              <Badge color={health.chatTest ? "green" : "red"}>
                {health.chatTest ? "CHAT OK" : "CHAT ERR"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-xs">LOADING...</div>
        ) : (
          <Table
            headers={["TIME", "DRIVER", "QUESTION", "ANSWER PREVIEW", "LATENCY"]}
            rows={logs.map((log) => [
              <span className="font-mono text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleString()}
              </span>,
              <span className="text-sm">{log.driver?.name ?? "—"}</span>,
              <span className="text-sm max-w-xs truncate block" title={log.question}>
                {log.question}
              </span>,
              <span
                className="font-mono text-xs text-slate-400 max-w-xs truncate block"
                title={log.answer}
              >
                {log.answer?.slice(0, 80)}...
              </span>,
              <span className="font-mono text-xs text-slate-500">
                {log.latencyMs ? `${(log.latencyMs / 1000).toFixed(1)}s` : "—"}
              </span>,
            ])}
          />
        )}
      </div>
    </div>
  );
}
