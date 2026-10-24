# MACHINA-X Master Reproduction Script
# =====================================
# Executes the full experimental pipeline from scratch:
# 1. Dataset synthesis & run-level partitioning
# 2. Stage 1 (Isolation Forest), Stage 2 (XGBoost), Stage 3 (LSTM RUL), and SHAP training
# 3. UCI AI4I 2020 benchmark training and cross-validation
# 4. Latency benchmarking (500 windows, p50/p95 measurement)
# 5. Robustness evaluation (5-seed evaluation + Leave-One-Load-Out generalization)
# 6. Standalone research document generation (DOCX and Markdown)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MACHINA-X: Full Scientific Reproduction Pipeline        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "`n[1/6] Generating synthetic motor simulation dataset..." -ForegroundColor Yellow
python scripts/generate_dataset.py

Write-Host "`n[2/6] Training motor digital twin models (Stages 1, 2, 3 + SHAP)..." -ForegroundColor Yellow
python scripts/train_all_models.py

Write-Host "`n[3/6] Training UCI AI4I 2020 benchmark models (4-model comparison + 5-fold CV)..." -ForegroundColor Yellow
python ml/training/train_ai4i_models.py

Write-Host "`n[4/6] Executing hardware latency benchmark (500 windows)..." -ForegroundColor Yellow
python scripts/benchmark_latency.py

Write-Host "`n[5/6] Executing robustness evaluation (5 seeds + Leave-One-Load-Out)..." -ForegroundColor Yellow
python scripts/run_robustness_eval.py

Write-Host "`n[6/8] Running algorithmic model selection and Stage 1 diagnosis..." -ForegroundColor Yellow
python scripts/run_model_selection.py
python scripts/generate_stage1_diagnosis.py

Write-Host "`n[7/8] Generating publication figures, LaTeX tables, and research numbers..." -ForegroundColor Yellow
python scripts/make_paper_figures.py
python scripts/generate_paper_numbers.py
python scripts/generate_research_report.py

Write-Host "`n[8/8] Verifying full system integrity and mathematical invariants..." -ForegroundColor Yellow
python scripts/verify_integrity.py

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   All models trained, evaluated, and verified!            " -ForegroundColor Green
Write-Host "   Output reports available in docs/reports/               " -ForegroundColor Green
Write-Host "   Publication figures in docs/paper_assets/               " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
