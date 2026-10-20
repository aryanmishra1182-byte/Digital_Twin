import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Activity,
  Cpu,
  Sparkles,
  Clock,
  Zap,
  Waves,
  Thermometer,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { DigitalTwinState, TelemetryPoint } from '../types';
import { api } from '../api/client';

interface MotorDetailProps {
  twin?: DigitalTwinState;
  onOpenSimulator: () => void;
}

export const MotorDetail: React.FC<MotorDetailProps> = ({ twin, onOpenSimulator }) => {
  const { motorId } = useParams<{ motorId: string }>();
  const navigate = useNavigate();
  const id = motorId || 'MOTOR-001';

  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await api.getTelemetryHistory(id, 25);
        if (isMounted) {
          // Reverse so chronological order left to right
          setHistory(data.slice().reverse());
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const chartData = history.map((pt) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    currentRms: Number(pt.currentRms.toFixed(2)),
    vibRms: Number(pt.vibRms.toFixed(2)),
    vibKurtosis: Number(pt.vibKurtosis.toFixed(2)),
    temperatureC: Number(pt.temperatureC.toFixed(1)),
    brbSideband: Number((pt.brbSidebandRatio * 100).toFixed(2))
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold font-mono text-slate-100">{id}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Digital Twin Replica
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {twin?.motorName || '3-Phase Squirrel Cage Induction Motor'} | Location: Plant Line A
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#111827] border border-[#243247] rounded-lg px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-400">Health Score</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {twin ? `${twin.healthScore}%` : '--'}
            </div>
          </div>
          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Inject Fault Scenario
          </button>
        </div>
      </div>

      {/* Motor Rated Specs & Physical Operating Point */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Rated Power</div>
          <div className="font-mono font-bold text-slate-100 mt-0.5">3.0 kW (4.0 HP)</div>
        </div>
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Supply Supply</div>
          <div className="font-mono font-bold text-slate-100 mt-0.5">415 V / 50 Hz</div>
        </div>
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Poles & Sync Speed</div>
          <div className="font-mono font-bold text-slate-100 mt-0.5">4 Poles / 1500 RPM</div>
        </div>
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Rated Speed / Slip</div>
          <div className="font-mono font-bold text-slate-100 mt-0.5">1440 RPM (s ≈ 0.04)</div>
        </div>
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Current Sampling</div>
          <div className="font-mono font-bold text-slate-100 mt-0.5">10 kHz (10k / 1s win)</div>
        </div>
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-3">
          <div className="text-slate-400 text-[10px]">Operating Load</div>
          <div className="font-mono font-bold text-sky-400 mt-0.5">{twin?.latestLoadPct || 100}% Load</div>
        </div>
      </div>

      {/* Quick Navigation Cards to Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div
          onClick={() => navigate(`/diagnosis/${id}`)}
          className="bg-[#151d2e] border border-[#243247] hover:border-sky-500/50 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <div className="font-semibold text-slate-200">Stage 2: Fault Diagnosis</div>
              <div className="text-slate-400 text-[11px]">
                Condition: <span className="font-mono text-slate-200">{twin?.predictedFaultClass}</span>
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => navigate(`/explainability/${id}`)}
          className="bg-[#151d2e] border border-[#243247] hover:border-sky-500/50 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-semibold text-slate-200">SHAP Explainability Layer</div>
              <div className="text-slate-400 text-[11px]">Feature-level physics attribution</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => navigate(`/rul/${id}`)}
          className="bg-[#151d2e] border border-[#243247] hover:border-sky-500/50 rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-semibold text-slate-200">Stage 3: Remaining Useful Life</div>
              <div className="text-slate-400 text-[11px]">
                {twin?.estimatedRulHours != null ? `${twin.estimatedRulHours.toFixed(1)} hours remaining` : 'Accumulating history...'}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>

      {/* Telemetry Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stator Current Chart */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Stator Current RMS (A)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Latest: {twin?.latestCurrentRms.toFixed(2)} A
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="currentRms" stroke="#38bdf8" strokeWidth={2} dot={false} name="Current RMS (A)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vibration Chart */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Waves className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Vibration RMS (m/s²) & Kurtosis
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Kurtosis: {twin?.latestVibKurtosis.toFixed(2)}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="vibRms" stroke="#f59e0b" strokeWidth={2} dot={false} name="Vib RMS (m/s²)" />
                <Line type="monotone" dataKey="vibKurtosis" stroke="#10b981" strokeWidth={1.5} dot={false} name="Kurtosis" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Motor Winding Temperature (°C)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {twin?.latestTemperatureC.toFixed(1)} °C
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="temperatureC" stroke="#f43f5e" strokeWidth={2} dot={false} name="Temperature (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BRB Sideband Ratio Chart */}
        <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Broken Rotor Bar Sideband Ratio (%)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-indigo-300">
              fs*(1 ± 2s) Sidebands
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="brbSideband" stroke="#818cf8" strokeWidth={2} dot={false} name="Sideband Ratio (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
