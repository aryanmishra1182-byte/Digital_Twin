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
  Gauge,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { DigitalTwinState, TelemetryPoint } from '../types';
import { api } from '../api/client';
import { StateBadge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EquipmentSchematic } from '../components/EquipmentSchematic';
import { InstrumentHero } from '../components/InstrumentHero';
import { SparklineMetricsRow } from '../components/SparklineMetricsRow';
import { DivergingShapSection } from '../components/DivergingShapSection';
import { ModelProvenanceTable } from '../components/ModelProvenanceTable';

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
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'CURRENT' | 'VIBRATION' | 'THERMAL'>('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await api.getTelemetryHistory(id, 30);
        if (isMounted) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-recharts-tooltip">
          <div className="font-mono text-slate-400 border-b border-panel-border/60 pb-1 mb-1.5 text-[11px]">
            T: {label}
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex justify-between gap-4">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span className="font-semibold text-slate-100">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-rule flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-mute font-mono uppercase tracking-wider mb-1">
            Cyber-Physical Digital Twin · Unit {id}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal text-ink">
            Motor {id} Instrument Panel
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/diagnosis/${id}`)}
            className="px-3 py-1.5 rounded-full bg-panel hover:bg-track text-ink border border-rule font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
          </button>
          <button
            onClick={() => navigate(`/explainability/${id}`)}
            className="px-3 py-1.5 rounded-full bg-panel hover:bg-track text-ink border border-rule font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SHAP</span>
          </button>
          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-1.5 rounded-full bg-ink text-bg font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Inject Telemetry</span>
          </button>
        </div>
      </div>

      {/* SVG Health Ring & Verdict Hero */}
      <InstrumentHero twin={twin} onOpenSimulator={onOpenSimulator} />

      {/* 4-Metric Sparklines Separated by Hairline Rules */}
      <SparklineMetricsRow twin={twin} />

      {/* Diverging SHAP Attribution Section */}
      <DivergingShapSection
        predictedClass={twin?.predictedFaultClass}
        attributions={
          twin?.topShapAttributions && twin.topShapAttributions.length > 0
            ? twin.topShapAttributions.map((a: any) => ({
                feature: a.feature_name,
                name: a.feature_name.replace(/_/g, ' '),
                value: a.feature_value ?? 0.05,
                shapValue: a.shap_value ?? 0.25,
                physicsReason: `Marginal SHAP contribution towards ${twin.predictedFaultClass} state.`
              }))
            : undefined
        }
      />

      {/* Interactive Equipment Subsystem Schematic */}
      <EquipmentSchematic twin={twin} onOpenSimulator={onOpenSimulator} />

      {/* Real-time Oscilloscope & Telemetry Trends */}
      <div className="bg-panel border border-panel-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
              Synchronized Multi-Modal Telemetry Stream
            </h2>
            <p className="text-xs text-slate-400">
              Live rolling 30-window buffer (Current RMS, Vibration RMS, Casing Temperature)
            </p>
          </div>

          {/* Channel Filters */}
          <div className="flex bg-surface p-1 rounded-md border border-panel-border text-xs">
            {(['ALL', 'CURRENT', 'VIBRATION', 'THERMAL'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedChannel === ch
                    ? 'bg-panel text-slate-100 border border-panel-border-strong shadow-subtle'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Live Line Chart */}
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                {(selectedChannel === 'ALL' || selectedChannel === 'CURRENT') && (
                  <Line
                    type="monotone"
                    dataKey="currentRms"
                    name="Current (A RMS)"
                    stroke="#0ea5e9"
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {(selectedChannel === 'ALL' || selectedChannel === 'VIBRATION') && (
                  <Line
                    type="monotone"
                    dataKey="vibRms"
                    name="Vibration (mm/s)"
                    stroke="#a855f7"
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {(selectedChannel === 'ALL' || selectedChannel === 'THERMAL') && (
                  <Line
                    type="monotone"
                    dataKey="temperatureC"
                    name="Temp (°C)"
                    stroke="#f59e0b"
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {(selectedChannel === 'ALL' || selectedChannel === 'CURRENT') && (
                  <Line
                    type="monotone"
                    dataKey="brbSideband"
                    name="BRB Sideband (% fs)"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              Waiting for telemetry ingress...
            </div>
          )}
        </div>
      </div>

      {/* Downstream Inference Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fault Classification Card */}
        <div
          onClick={() => navigate(`/diagnosis/${id}`)}
          className="bg-panel border border-panel-border rounded-lg p-4 cursor-pointer hover:border-panel-border-strong transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase font-mono text-[10px]">Stage 2 Classifier</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="font-semibold text-slate-100 text-sm">
            {twin?.predictedFaultClass?.replace(/_/g, ' ') || 'HEALTHY'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Confidence: <strong className="text-slate-200 font-mono font-normal">{((twin?.confidence || 0.95) * 100).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Explainability Card */}
        <div
          onClick={() => navigate(`/explainability/${id}`)}
          className="bg-panel border border-panel-border rounded-lg p-4 cursor-pointer hover:border-panel-border-strong transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase font-mono text-[10px]">SHAP Attribution</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="font-semibold text-slate-100 text-sm">
            {twin?.topShapAttributions && twin.topShapAttributions.length > 0
              ? twin.topShapAttributions[0].feature_name.replace(/_/g, ' ')
              : 'Dominant Spectral Drivers'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Top feature influence on current state
          </div>
        </div>

        {/* RUL Card */}
        <div
          onClick={() => navigate(`/rul/${id}`)}
          className="bg-panel border border-panel-border rounded-lg p-4 cursor-pointer hover:border-panel-border-strong transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase font-mono text-[10px]">Stage 3 RUL Sequence</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="font-semibold text-slate-100 text-sm font-mono text-emerald-400">
            {twin?.estimatedRulHours !== null && twin?.estimatedRulHours !== undefined
              ? `${twin.estimatedRulHours.toFixed(1)} Hours Remaining`
              : 'Accumulating Buffer'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            PyTorch LSTM degradation trajectory
          </div>
        </div>
      </div>

      {/* Model Provenance & Architecture Verification */}
      <ModelProvenanceTable />
    </div>
  );
};
