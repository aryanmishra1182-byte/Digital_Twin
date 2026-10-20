import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Info,
  CheckSquare,
  Wrench
} from 'lucide-react';
import { AlertRecord, AlertStatus, AlertSeverity } from '../types';
import { api } from '../api/client';

interface AlertsMaintenanceProps {
  alerts: AlertRecord[];
  onRefresh: () => void;
}

export const AlertsMaintenance: React.FC<AlertsMaintenanceProps> = ({ alerts, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'RESOLVE' | null>(null);
  const [operatorNote, setOperatorNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const handleActionSubmit = async () => {
    if (!selectedAlert || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === 'ACKNOWLEDGE') {
        await api.acknowledgeAlert(selectedAlert.id, operatorNote);
      } else {
        await api.resolveAlert(selectedAlert.id, operatorNote);
      }
      setSelectedAlert(null);
      setActionType(null);
      setOperatorNote('');
      onRefresh();
    } catch (e) {
      alert('Failed to update alert: ' + e);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'P1_CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            P1 CRITICAL
          </span>
        );
      case 'P2_WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            P2 WARNING
          </span>
        );
      case 'P3_INFO':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            P3 INFO
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400">ACTIVE</span>;
      case 'ACKNOWLEDGED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">ACKNOWLEDGED</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">RESOLVED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Alerts & Maintenance Advisory Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized notifications (P1/P2/P3 per IEEE paper) with domain-informed inspection checklists
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-[#151d2e] p-1 rounded-lg border border-[#243247] text-xs">
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterStatus === st ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Advisory Logic Principles */}
      <div className="bg-[#151d2e] border border-sky-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
        <Wrench className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-300">Advisory Decision Engine: </span>
          The system evaluates incoming telemetry against detected anomaly scores, XGBoost fault confidence, and physical standards (ISO 10816-3, IEEE 522). It provides suggested non-intrusive tests (MCSA FFT, Megger insulation, bearing envelope demodulation) without asserting uncertified machinery tripping authority.
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#151d2e] border border-[#243247] rounded-xl p-5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-[#243247] bg-[#111827]">
              <tr>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Motor</th>
                <th className="py-2.5 px-3">Alert Title</th>
                <th className="py-2.5 px-3">Suggested Inspection Action</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243247]/50">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No alerts matching current filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">{getSeverityBadge(alert.severity)}</td>
                    <td className="py-3 px-3">{getStatusBadge(alert.status)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{alert.motorId}</td>
                    <td className="py-3 px-3 font-medium text-slate-200">{alert.title}</td>
                    <td className="py-3 px-3 text-slate-400 max-w-sm">
                      <div className="truncate">{alert.suggestedAction}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setActionType('ACKNOWLEDGE');
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px]"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setActionType('RESOLVE');
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[11px]"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedAlert && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#151d2e] border border-[#243247] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-2">
              {actionType === 'ACKNOWLEDGE' ? 'Acknowledge Maintenance Alert' : 'Resolve Maintenance Alert'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {selectedAlert.motorId} — {selectedAlert.title}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Note / Maintenance Action Taken:
              </label>
              <textarea
                rows={3}
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                placeholder="e.g. Dispatched technician for MCSA inspection; verified motor bearing lubrication level."
                className="w-full bg-[#182235] border border-[#243247] rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setActionType(null);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-[#243247] text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md"
              >
                {submitting ? 'Updating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
