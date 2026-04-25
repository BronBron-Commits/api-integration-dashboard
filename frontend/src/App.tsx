import { useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  CloudSun,
  Code,
  Globe,
  RefreshCw,
  Server,
} from "lucide-react"

type Weather = {
  source: string
  ok: boolean
  location: string
  temperatureF: number
  windMph: number
  precipitation: number
  updatedAt: string
  error?: string
}

type GithubStatus = {
  source: string
  ok: boolean
  indicator: string
  description: string
  updatedAt: string
  error?: string
}

type IpInfo = {
  source: string
  ok: boolean
  ip: string
  city: string
  region: string
  country: string
  org: string
  error?: string
}

type Health = {
  ok: boolean
  time: string
}

const API = `http://${window.location.hostname}:5050`

export default function App() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [github, setGithub] = useState<GithubStatus | null>(null)
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadAll() {
    setLoading(true)
    setError(null)

    try {
      const [healthRes, weatherRes, githubRes, ipRes] = await Promise.all([
        fetch(`${API}/api/health`),
        fetch(`${API}/api/weather`),
        fetch(`${API}/api/github-status`),
        fetch(`${API}/api/ip-info`),
      ])

      if (!healthRes.ok || !weatherRes.ok || !githubRes.ok || !ipRes.ok) {
        throw new Error("One or more integrations failed")
      }

      setHealth(await healthRes.json())
      setWeather(await weatherRes.json())
      setGithub(await githubRes.json())
      setIpInfo(await ipRes.json())
    } catch {
      setError("Could not load one or more external integrations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const interval = window.setInterval(loadAll, 30000)
    return () => window.clearInterval(interval)
  }, [])

  const healthyServices = [weather, github, ipInfo].filter((item) => item?.ok).length

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-violet-400">
              API Integration Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              External API ingestion, normalization, and service status display
            </p>
          </div>

          <button
            onClick={loadAll}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 p-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              icon={<Server />}
              label="Backend API"
              value={health?.ok ? "Online" : "Unknown"}
              detail={health?.time || "Waiting for health check"}
            />
            <Metric
              icon={<Activity />}
              label="Healthy Integrations"
              value={`${healthyServices}/3`}
              detail="Normalized external services"
            />
            <Metric
              icon={<RefreshCw />}
              label="Refresh Interval"
              value="30s"
              detail="Auto-refresh enabled"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <IntegrationCard
              icon={<CloudSun />}
              title="Weather"
              source={weather?.source || "open-meteo"}
              ok={!!weather?.ok}
            >
              {weather ? (
                <>
                  <Value label="Location" value={weather.location} />
                  <Value label="Temperature" value={`${weather.temperatureF}°F`} />
                  <Value label="Wind" value={`${weather.windMph} mph`} />
                  <Value label="Precipitation" value={`${weather.precipitation}`} />
                </>
              ) : (
                <Empty />
              )}
            </IntegrationCard>

            <IntegrationCard
              icon={<Code />}
              title="GitHub Status"
              source={github?.source || "github-status"}
              ok={!!github?.ok}
            >
              {github ? (
                <>
                  <Value label="Indicator" value={github.indicator || "none"} />
                  <Value label="Status" value={github.description} />
                  <Value label="Updated" value={github.updatedAt || "-"} />
                </>
              ) : (
                <Empty />
              )}
            </IntegrationCard>

            <IntegrationCard
              icon={<Globe />}
              title="IP Info"
              source={ipInfo?.source || "ipapi"}
              ok={!!ipInfo?.ok}
            >
              {ipInfo ? (
                <>
                  <Value label="IP" value={ipInfo.ip} />
                  <Value label="Location" value={`${ipInfo.city}, ${ipInfo.region}`} />
                  <Value label="Provider" value={ipInfo.org} />
                </>
              ) : (
                <Empty />
              )}
            </IntegrationCard>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-bold">Normalized Integration Model</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Each external service returns different raw data. The backend converts
              them into consistent, UI-friendly responses with source, status,
              selected fields, timestamps, and error handling.
            </p>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
{`{
  source: string,
  ok: boolean,
  updatedAt?: string,
  error?: string,
  data: normalized fields
}`}
            </pre>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-bold">Integration Health</h2>

            <div className="mt-4 space-y-3">
              <HealthRow name="Weather API" ok={!!weather?.ok} />
              <HealthRow name="GitHub Status API" ok={!!github?.ok} />
              <HealthRow name="IP Info API" ok={!!ipInfo?.ok} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-bold">What this demonstrates</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>External API consumption from a backend service</li>
              <li>Data normalization before frontend rendering</li>
              <li>Parallel API fetching and dashboard refresh</li>
              <li>Error handling for unreliable third-party services</li>
              <li>Separation between UI and integration logic</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-violet-400">{icon}</div>
      <div className="mt-4 text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  )
}

function IntegrationCard({
  icon,
  title,
  source,
  ok,
  children,
}: {
  icon: React.ReactNode
  title: string
  source: string
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-violet-400">{icon}</div>
        <StatusBadge ok={ok} />
      </div>

      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="text-xs text-slate-500">Source: {source}</p>

      <div className="mt-4 space-y-2">{children}</div>
    </div>
  )
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-800 pb-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-slate-500">Waiting for data...</p>
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-bold ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      }`}
    >
      {ok ? "OK" : "DOWN"}
    </span>
  )
}

function HealthRow({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
      <span className="text-slate-300">{name}</span>
      <StatusBadge ok={ok} />
    </div>
  )
}
