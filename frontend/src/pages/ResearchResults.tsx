import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  ShieldCheck,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../api/client';
import { Ai4iBenchmarkMetrics } from '../types';
import { SectionHeader } from '../components/ui/SectionHeader';

export const ResearchResults: React.FC = () => {
  const [benchmark, setBenchmark] = useState<Ai4iBenchmarkMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getAi4iBenchmark().then((data) => {
      if (isMounted) {
        setBenchmark(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleDownloadReport = () => {
    const reportContent = `# Experimental Research Report: Explainable Digital Twin for Industrial Predictive Maintenance

**Authors / Investigators:** Aditya Gupta, Aditya Maurya, Ananya Sharma, Aryan Mishra  
**Benchmark Target:** UCI AI4I 2020 Predictive Maintenance Dataset  
**Framework:** Closed-Loop Physical Modeling + XGBoost 3.x + TreeSHAP Explainability  
**Generated Date:** ${new Date().toISOString()}

---

## 1. Executive Summary & Problem Formulation
Predictive maintenance aims to detect early degradation signatures before irreversible catastrophic machine damage occurs. This research implements an end-to-end Explainable Digital Twin that bridges high-resolution telemetry, multi-stage machine learning inference, and game-theoretic Shapley attributions.

---

## 2. Benchmark Dataset Provenance & Attribution
- **Dataset Official Title:** UCI AI4I 2020 Predictive Maintenance Dataset
- **Repository URL:** https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset
- **Original Citation:** Mathes, S. (2020). AI4I 2020 Predictive Maintenance Dataset. UCI Machine Learning Repository.
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Total Records:** 10,000 instances
- **Class Distribution:** 9,661 Healthy (96.61%), 339 Failures (3.39%)
- **Class Imbalance Ratio:** 28.5 : 1
- **Failure Modes:** Tool Wear Failure (TWF: 46), Heat Dissipation Failure (HDF: 115), Power Failure (PWF: 95), Overstrain Failure (OSF: 98), Random Failure (RNF: 19).

---

## 3. Feature Engineering & Preprocessing
To ground the feature space in industrial physical mechanics, three domain-guided features were derived:
1. **Temperature Difference (K):** $\\Delta T = T_{\\text{process}} - T_{\\text{air}}$
2. **Mechanical Power (W):** $P = \\tau \\cdot \\omega = \\tau \\cdot \\left(\\frac{2\\pi \\cdot N}{60}\\right)$
3. **Mechanical Overstrain Metric:** $M_{\\text{overstrain}} = t_{\\text{tool wear}} \\cdot \\tau$
4. **Product Quality Encoding:** Type L (0), M (1), H (2).

---

## 4. Model Comparison & Experimental Results
Stratified 80/20 train/test partition (2,000 unseen test instances with 68 failure cases).

| Model Architecture | Test Accuracy | Precision | Recall | F1-Score | ROC-AUC | 5-Fold CV F1 (Mean ± Std) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 85.75% | 17.80% | 88.24% | 0.2963 | 0.9393 | 0.2719 ± 0.0126 |
| **Decision Tree (Baseline)** | 95.00% | 38.89% | 82.35% | 0.5283 | 0.8568 | 0.5530 ± 0.0153 |
| **Random Forest** | 98.40% | 74.32% | 80.88% | 0.7746 | 0.9831 | 0.8246 ± 0.0374 |
| **XGBoost Classifier (Champion)** | **98.45%** | **74.03%** | **83.82%** | **0.7862** | **0.9808** | **0.7775 ± 0.0245** |

### Confusion Matrix (Champion XGBoost on Test Set):
- True Negatives (TN): 1,912
- False Positives (FP): 20
- False Negatives (FN): 11
- True Positives (TP): 57

---

## 5. TreeSHAP Global Feature Importance
1. **Rotational Speed (RPM):** Mean |SHAP| = 1.3314
2. **Tool Wear Time (min):** Mean |SHAP| = 1.2755
3. **Mechanical Power (W):** Mean |SHAP| = 1.2263
4. **Overstrain Metric:** Mean |SHAP| = 0.5984
5. **Temperature Difference (K):** Mean |SHAP| = 0.5015
6. **Torque (Nm):** Mean |SHAP| = 0.4996

---

## 6. Threats to Validity & Physical Limitations
1. **Synthetic Nature of AI4I Dataset:** The AI4I 2020 dataset was generated using physical simulation models; physical dynamometer testing is essential before deploying on human-safety-critical machinery.
2. **Correlation vs. Causation:** High Shapley attribution establishes model sensitivity, not independent physical causation.
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Explainable_Digital_Twin_Research_Report_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const comparisons = benchmark?.model_comparison || {
    "Logistic Regression (Baseline)": { test_accuracy: 0.8575, test_precision: 0.178, test_recall: 0.8824, test_f1: 0.2963, test_roc_auc: 0.9393, confusion_matrix: [[1655, 277], [8, 60]], cv_f1_mean: 0.2719, cv_f1_std: 0.0126, cv_roc_auc_mean: 0.9235 },
    "Decision Tree (Baseline)": { test_accuracy: 0.95, test_precision: 0.3889, test_recall: 0.8235, test_f1: 0.5283, test_roc_auc: 0.8568, confusion_matrix: [[1844, 88], [12, 56]], cv_f1_mean: 0.553, cv_f1_std: 0.0153, cv_roc_auc_mean: 0.9168 },
    "Random Forest": { test_accuracy: 0.984, test_precision: 0.7432, test_recall: 0.8088, test_f1: 0.7746, test_roc_auc: 0.9831, confusion_matrix: [[1913, 19], [13, 55]], cv_f1_mean: 0.8246, cv_f1_std: 0.0374, cv_roc_auc_mean: 0.9797 },
    "XGBoost Classifier": { test_accuracy: 0.9845, test_precision: 0.7403, test_recall: 0.8382, test_f1: 0.7862, test_roc_auc: 0.9808, confusion_matrix: [[1912, 20], [11, 57]], cv_f1_mean: 0.7775, cv_f1_std: 0.0245, cv_roc_auc_mean: 0.9795 }
  };

  const shapData = benchmark?.shap_global_ranking || [
    { feature: 'Rotational_speed_rpm', mean_abs_shap: 1.3314 },
    { feature: 'Tool_wear_min', mean_abs_shap: 1.2755 },
    { feature: 'Mechanical_Power_W', mean_abs_shap: 1.2263 },
    { feature: 'Overstrain_Metric', mean_abs_shap: 0.5984 },
    { feature: 'Temp_difference_K', mean_abs_shap: 0.5015 },
    { feature: 'Torque_Nm', mean_abs_shap: 0.4996 },
    { feature: 'Process_temperature_K', mean_abs_shap: 0.2971 },
    { feature: 'Air_temperature_K', mean_abs_shap: 0.2453 }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Download Report Action */}
      <SectionHeader
        title="Research Paper Experimental Evaluation & Results"
        subtitle="Reproducible empirical benchmark comparison on the official UCI AI4I 2020 Predictive Maintenance Dataset."
        tag="Academic Report"
        actions={
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs inline-flex items-center gap-2 shadow-subtle transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Research Report (.md)</span>
          </button>
        }
      />

      {/* Dataset Provenance & Citation Placard */}
      <div className="bg-panel border border-panel-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-panel-border/60">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-brand-400">
              Benchmark Dataset
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-0.5">
              UCI AI4I 2020 Predictive Maintenance Dataset
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Mathes, S. (2020). AI4I 2020 Predictive Maintenance Dataset. UCI Machine Learning Repository. Creative Commons Attribution 4.0 International (CC BY 4.0).
            </p>
          </div>

          <a
            href="https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-slate-300 border border-panel-border text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>UCI Dataset Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="bg-surface/30 p-3 rounded border border-panel-border/40">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Records</span>
            <span className="text-xl font-mono font-bold text-slate-100 mt-1 block">10,000</span>
            <span className="text-[10px] text-slate-400">Industrial milling machines</span>
          </div>

          <div className="bg-surface/30 p-3 rounded border border-panel-border/40">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Failure Cases</span>
            <span className="text-xl font-mono font-bold text-rose-400 mt-1 block">339 (3.39%)</span>
            <span className="text-[10px] text-slate-400">Imbalance ratio: 28.5:1</span>
          </div>

          <div className="bg-surface/30 p-3 rounded border border-panel-border/40">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Test Set Split</span>
            <span className="text-xl font-mono font-bold text-brand-400 mt-1 block">2,000 (20%)</span>
            <span className="text-[10px] text-slate-400">Stratified partition</span>
          </div>

          <div className="bg-surface/30 p-3 rounded border border-panel-border/40">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Champion Model</span>
            <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">XGBoost 3.x</span>
            <span className="text-[10px] text-slate-400">Test F1: 0.7862</span>
          </div>
        </div>
      </div>

      {/* Experimental Model Comparison Table */}
      <div className="bg-panel border border-panel-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Comparative Model Performance Benchmark
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated on identical unseen 20% test partition (2,000 samples with 68 failures)
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
            Measured Results
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-panel-border text-slate-400 uppercase font-mono text-[10px] bg-surface/30">
                <th className="py-3 px-3.5">Model Architecture</th>
                <th className="py-3 px-3.5">Test Accuracy</th>
                <th className="py-3 px-3.5">Precision</th>
                <th className="py-3 px-3.5">Recall</th>
                <th className="py-3 px-3.5 font-bold text-slate-200">F1-Score</th>
                <th className="py-3 px-3.5">ROC-AUC</th>
                <th className="py-3 px-3.5">5-Fold CV F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-border/50 text-slate-300 font-mono text-[11px]">
              {Object.entries(comparisons).map(([name, m]) => {
                const isChampion = name.includes('XGBoost');
                return (
                  <tr
                    key={name}
                    className={`transition-colors ${
                      isChampion ? 'bg-brand-950/20 font-medium' : 'hover:bg-surface/30'
                    }`}
                  >
                    <td className="py-3 px-3.5 font-sans font-semibold text-slate-100 flex items-center gap-2">
                      {name}
                      {isChampion && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          Champion
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-200">{(m.test_accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3.5 text-slate-200">{(m.test_precision * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3.5 text-slate-200">{(m.test_recall * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3.5 font-bold text-emerald-400">{m.test_f1.toFixed(4)}</td>
                    <td className="py-3 px-3.5 text-brand-400">{m.test_roc_auc.toFixed(4)}</td>
                    <td className="py-3 px-3.5 text-slate-400">{m.cv_f1_mean.toFixed(4)} ± {m.cv_f1_std.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix & Global SHAP Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Card */}
        <div className="bg-panel border border-panel-border rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">
              Champion Model Confusion Matrix
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Confusion matrix evaluated on 2,000 unseen test instances
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-center font-mono">
              <div className="bg-surface/60 border border-panel-border rounded-lg p-4">
                <span className="text-[10px] text-slate-400 uppercase block">True Negative (TN)</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">1,912</span>
                <span className="text-[10px] text-slate-400">Correctly identified normal</span>
              </div>
              <div className="bg-surface/60 border border-panel-border rounded-lg p-4">
                <span className="text-[10px] text-slate-400 uppercase block">False Positive (FP)</span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">20</span>
                <span className="text-[10px] text-slate-400">False alarm warning</span>
              </div>
              <div className="bg-surface/60 border border-panel-border rounded-lg p-4">
                <span className="text-[10px] text-slate-400 uppercase block">False Negative (FN)</span>
                <span className="text-2xl font-bold text-rose-400 mt-1 block">11</span>
                <span className="text-[10px] text-slate-400">Missed failure instance</span>
              </div>
              <div className="bg-surface/60 border border-panel-border rounded-lg p-4">
                <span className="text-[10px] text-slate-400 uppercase block">True Positive (TP)</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">57</span>
                <span className="text-[10px] text-slate-400">Correctly caught failure</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-panel-border/60 text-[11px] text-slate-400 flex justify-between">
            <span>Overall Specificity: 98.96%</span>
            <span>Sensitivity / Recall: 83.82%</span>
          </div>
        </div>

        {/* Global SHAP Ranking Chart */}
        <div className="bg-panel border border-panel-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Global TreeSHAP Feature Attributions
              </h3>
              <p className="text-xs text-slate-400">
                Average absolute Shapley impact \( E[|\\phi_i|] \) across the dataset
              </p>
            </div>
            <span className="font-mono text-[10px] text-slate-400">TreeSHAP</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shapData.map((d) => ({
                  feature: d.feature.replace(/_/g, ' '),
                  mean_abs_shap: d.mean_abs_shap
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="feature" type="category" stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} width={160} />
                <Tooltip
                  formatter={(val: any) => [val, 'Mean |SHAP|']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="mean_abs_shap" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
