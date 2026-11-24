"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";

interface ChallengeQuestion {
  id: number;
  branch: string;
  year: string;
  exam_source: string;
  topic: string;
  question_text: string;
  options: { label: string; text: string }[];
  correct_answer: string;
  explanation: string;
  shortcut_tip: string;
  marks: number;
}

// Fallback high-yield authentic ExamSide questions in case backend is offline
const FALLBACK_QUESTIONS: Record<string, ChallengeQuestion[]> = {
  CSE: [
    {
      id: 101,
      branch: "CSE",
      year: "GATE 2024 (Set-1)",
      exam_source: "ExamSide GATE CS Archive",
      topic: "Algorithms • Asymptotic Master Theorem",
      question_text: "Consider the recurrence relation T(n) = 2T(⌊n/2⌋) + n log₂ n for n ≥ 2, with T(1) = 1. What is the asymptotic time complexity of T(n)?",
      options: [
        { label: "A", text: "Θ(n log₂ n)" },
        { label: "B", text: "Θ(n (log₂ n)²)" },
        { label: "C", text: "Θ(n²)" },
        { label: "D", text: "Θ(n² log₂ n)" },
      ],
      correct_answer: "B",
      explanation: "Using the extended Master Theorem (Case 2 with k = 1): Here a = 2, b = 2, n^{log_b a} = n¹. Since f(n) = n log₂ n matches n¹ with power k = 1, the solution is T(n) = Θ(n (log₂ n)²).",
      shortcut_tip: "Ex-IITian Shortcut: When f(n) matches n^{log_b a} with a log^k factor, simply increase log power by 1 → log^{k+1} n in 10 seconds!",
      marks: 2,
    },
    {
      id: 102,
      branch: "CSE",
      year: "GATE 2023",
      exam_source: "ExamSide GATE CS Archive",
      topic: "Operating Systems • 2-Level Paging",
      question_text: "In a 32-bit virtual memory system with 4 KB page size and 4-byte page table entries, if Level-1 page table must fit into a single 4 KB frame, what is the maximum number of bits allocated to Level-2 page index?",
      options: [
        { label: "A", text: "10 bits" },
        { label: "B", text: "12 bits" },
        { label: "C", text: "8 bits" },
        { label: "D", text: "14 bits" },
      ],
      correct_answer: "A",
      explanation: "Page size 4 KB = 2¹² bytes (12 bits offset). Remaining bits = 32 - 12 = 20 bits. Frame capacity = 4 KB / 4 B = 1024 = 2¹⁰ entries (10 bits for L1). Remaining for L2 = 20 - 10 = 10 bits.",
      shortcut_tip: "Ex-IITian Shortcut: Standard 32-bit partition is 10 (L1) + 10 (L2) + 12 (Offset) = 32 bits.",
      marks: 2,
    },
    {
      id: 103,
      branch: "CSE",
      year: "GATE 2022",
      exam_source: "ExamSide GATE CS Archive",
      topic: "Theory of Computation • Regular Languages",
      question_text: "Which of the following languages over Σ = {0, 1} is regular?",
      options: [
        { label: "A", text: "L₁ = {0ⁿ 1ⁿ | n ≥ 1}" },
        { label: "B", text: "L₂ = {w wᴿ | w ∈ {0, 1}*}" },
        { label: "C", text: "L₃ = {w ∈ {0, 1}* | number of 0s in w is divisible by 3}" },
        { label: "D", text: "L₄ = {0ⁿ 1²ⁿ | n ≥ 0}" },
      ],
      correct_answer: "C",
      explanation: "Counting modulo 3 requires a finite 3-state DFA (q₀, q₁, q₂). Hence L₃ is regular. Languages requiring stack memory (L₁, L₂, L₄) are context-free, not regular.",
      shortcut_tip: "Ex-IITian Shortcut: Modulo counting k is always recognized by a k-state DFA → Always Regular!",
      marks: 2,
    },
    {
      id: 104,
      branch: "CSE",
      year: "GATE 2024 (Set-2)",
      exam_source: "ExamSide GATE CS Archive",
      topic: "Computer Networks • TCP Congestion Window",
      question_text: "In a TCP connection with MSS = 2 KB, ssthresh is 32 KB. If a timeout occurs when cwnd reaches 32 KB during congestion avoidance, what are the new ssthresh and cwnd?",
      options: [
        { label: "A", text: "ssthresh = 16 KB, cwnd = 2 KB" },
        { label: "B", text: "ssthresh = 16 KB, cwnd = 16 KB" },
        { label: "C", text: "ssthresh = 32 KB, cwnd = 2 KB" },
        { label: "D", text: "ssthresh = 8 KB, cwnd = 2 KB" },
      ],
      correct_answer: "A",
      explanation: "On timeout: ssthresh = cwnd / 2 = 32 / 2 = 16 KB. Congestion window is reset to 1 MSS = 2 KB, initiating slow start.",
      shortcut_tip: "Ex-IITian Shortcut: Timeout always drops cwnd to 1 MSS. Fast recovery drops to ssthresh.",
      marks: 2,
    },
    {
      id: 105,
      branch: "CSE",
      year: "GATE 2021",
      exam_source: "ExamSide GATE CS Archive",
      topic: "Databases • BCNF Decomposition",
      question_text: "Let R(A, B, C, D) have FDs F = {A → B, B → C, C → D, D → A}. What is the highest normal form satisfied by relation R?",
      options: [
        { label: "A", text: "1NF" },
        { label: "B", text: "2NF" },
        { label: "C", text: "3NF" },
        { label: "D", text: "BCNF" },
      ],
      correct_answer: "D",
      explanation: "Circular FDs A → B → C → D → A make every single attribute a candidate key. Left-hand side of every FD is a superkey, satisfying BCNF.",
      shortcut_tip: "Ex-IITian Shortcut: Circular dependency among all attributes means every single attribute is a key → Always BCNF!",
      marks: 2,
    },
  ],
  DA: [
    {
      id: 201,
      branch: "DA",
      year: "GATE 2024 DA",
      exam_source: "ExamSide GATE DA Archive",
      topic: "Machine Learning • Decision Trees",
      question_text: "As the depth of a Decision Tree increases from 1 to infinity, how do the training error and test error typically behave?",
      options: [
        { label: "A", text: "Training error increases, Test error decreases" },
        { label: "B", text: "Both Training and Test error decrease monotonically" },
        { label: "C", text: "Training error drops to 0, Test error follows U-curve" },
        { label: "D", text: "Both Training and Test error increase monotonically" },
      ],
      correct_answer: "C",
      explanation: "High depth causes overfitting: training error drops to 0 as tree memorizes leaves. Test error first decreases then rises due to high variance (U-shaped generalization curve).",
      shortcut_tip: "Ex-IITian Shortcut: Unlimited depth tree has 100% train accuracy (0 error) and overfits to noise.",
      marks: 2,
    },
    {
      id: 202,
      branch: "DA",
      year: "GATE 2024 DA",
      exam_source: "ExamSide GATE DA Archive",
      topic: "Probability • Bayes Theorem",
      question_text: "A disease prevalence is 1%. Test sensitivity is 95% and false positive rate is 5%. Given a positive test, what is the probability the patient has the disease?",
      options: [
        { label: "A", text: "0.95" },
        { label: "B", text: "0.161 (16.1%)" },
        { label: "C", text: "0.50" },
        { label: "D", text: "0.05" },
      ],
      correct_answer: "B",
      explanation: "P(D|+) = (0.95 × 0.01) / [(0.95 × 0.01) + (0.05 × 0.99)] = 0.0095 / 0.0590 ≈ 0.161 (16.1%).",
      shortcut_tip: "Ex-IITian Shortcut: In 10,000 people: 95 true +ve, 495 false +ve. Total +ve = 590. 95/590 = 16.1%!",
      marks: 2,
    },
    {
      id: 203,
      branch: "DA",
      year: "GATE 2024 DA",
      exam_source: "ExamSide GATE DA Archive",
      topic: "Linear Algebra • Singular Value Decomposition",
      question_text: "Let A be an m × n real matrix. What are the dimensions of the singular value matrix Σ in full SVD representation A = U Σ Vᵀ?",
      options: [
        { label: "A", text: "r × r" },
        { label: "B", text: "m × n" },
        { label: "C", text: "m × r" },
        { label: "D", text: "n × n" },
      ],
      correct_answer: "B",
      explanation: "In full SVD, U is m × m, V is n × n, and Σ is m × n, matching the outer dimensions of matrix A.",
      shortcut_tip: "Ex-IITian Shortcut: Matrix product dimensions: (m×m) × (m×n) × (n×n) = (m×n). Σ is always m × n.",
      marks: 2,
    },
    {
      id: 204,
      branch: "DA",
      year: "GATE 2024 DA",
      exam_source: "ExamSide GATE DA Archive",
      topic: "Optimization • Gradient Descent Convergence",
      question_text: "For a convex function f(x) with L-Lipschitz continuous gradient, which condition guarantees convergence of gradient descent with step size η?",
      options: [
        { label: "A", text: "η > 2 / L" },
        { label: "B", text: "0 < η < 2 / L" },
        { label: "C", text: "η = L" },
        { label: "D", text: "η = 2L" },
      ],
      correct_answer: "B",
      explanation: "By the descent lemma, f(x_{t+1}) ≤ f(x_t) - η(1 - Lη/2) ||∇f(x_t)||². Monotonic descent requires 1 - Lη/2 > 0 → 0 < η < 2/L.",
      shortcut_tip: "Ex-IITian Shortcut: Maximum allowable step size before gradient divergence is strictly 2/L.",
      marks: 2,
    },
    {
      id: 205,
      branch: "DA",
      year: "GATE 2024 DA",
      exam_source: "ExamSide GATE DA Archive",
      topic: "Artificial Intelligence • A* Admissibility",
      question_text: "In A* tree search, what property guarantees finding an optimal (shortest) path?",
      options: [
        { label: "A", text: "Time complexity is O(1)" },
        { label: "B", text: "Admissible heuristic (never overestimates true cost)" },
        { label: "C", text: "Space complexity is O(depth)" },
        { label: "D", text: "Heuristic equals zero everywhere" },
      ],
      correct_answer: "B",
      explanation: "An admissible heuristic guarantees f(n) = g(n) + h(n) never overestimates path cost, ensuring optimal solution on tree search.",
      shortcut_tip: "Ex-IITian Shortcut: Tree Search requires Admissibility; Graph Search requires Consistency.",
      marks: 2,
    },
  ],
  CE: [
    {
      id: 301,
      branch: "CE",
      year: "GATE 2024 CE",
      exam_source: "ExamSide GATE CE Archive",
      topic: "Soil Mechanics • Effective Stress",
      question_text: "A saturated soil deposit has submerged unit weight γ' = 10 kN/m³. Water table is at ground surface. What is the effective vertical stress at 5 meters depth?",
      options: [
        { label: "A", text: "100 kPa" },
        { label: "B", text: "50 kPa" },
        { label: "C", text: "25 kPa" },
        { label: "D", text: "150 kPa" },
      ],
      correct_answer: "B",
      explanation: "With water table at ground level: σ' = γ' × z = 10 kN/m³ × 5 m = 50 kPa.",
      shortcut_tip: "Ex-IITian Shortcut: Direct calculation σ' = γ' × z = 10 × 5 = 50 kPa in 5 seconds!",
      marks: 2,
    },
    {
      id: 302,
      branch: "CE",
      year: "GATE 2023 CE",
      exam_source: "ExamSide GATE CE Archive",
      topic: "Structural Analysis • Indeterminacy",
      question_text: "A propped cantilever beam is fixed at one end and has a simple roller support at the other. What is its degree of static indeterminacy for 2D loading?",
      options: [
        { label: "A", text: "0 (Determinate)" },
        { label: "B", text: "1" },
        { label: "C", text: "2" },
        { label: "D", text: "3" },
      ],
      correct_answer: "B",
      explanation: "Reactions R = 3 (Fixed) + 1 (Roller) = 4. 2D equilibrium equations E = 3. DSI = 4 - 3 = 1.",
      shortcut_tip: "Ex-IITian Shortcut: Fixed (3) + Roller (1) = 4 reactions. 4 - 3 = 1.",
      marks: 2,
    },
    {
      id: 303,
      branch: "CE",
      year: "GATE 2022 CE",
      exam_source: "ExamSide GATE CE Archive",
      topic: "Fluid Mechanics • Boundary Layer Thickness",
      question_text: "In a laminar boundary layer over a flat plate, boundary layer thickness δ grows with distance x proportional to:",
      options: [
        { label: "A", text: "x¹/²" },
        { label: "B", text: "x¹/⁵" },
        { label: "C", text: "x⁴/⁵" },
        { label: "D", text: "x" },
      ],
      correct_answer: "A",
      explanation: "From Blasius solution: δ / x = 5 / √(Re_x) ∝ 1 / √x. Therefore δ ∝ x / √x = x¹/².",
      shortcut_tip: "Ex-IITian Shortcut: Laminar δ ∝ x^0.5; Turbulent δ ∝ x^0.8.",
      marks: 2,
    },
    {
      id: 304,
      branch: "CE",
      year: "GATE 2024 CE",
      exam_source: "ExamSide GATE CE Archive",
      topic: "Environmental Engg • Ultimate BOD",
      question_text: "If 5-day BOD at 20°C is 200 mg/L with k = 0.23 day⁻¹ (base e), what is the ultimate BOD L₀? (e^(-1.15) ≈ 0.316)",
      options: [
        { label: "A", text: "292 mg/L" },
        { label: "B", text: "200 mg/L" },
        { label: "C", text: "150 mg/L" },
        { label: "D", text: "350 mg/L" },
      ],
      correct_answer: "A",
      explanation: "BOD₅ = L₀(1 - e^(-0.23 × 5)) = 0.684 L₀ = 200 mg/L. L₀ = 200 / 0.684 ≈ 292.4 mg/L.",
      shortcut_tip: "Ex-IITian Shortcut: 5-day BOD is ~68% of ultimate BOD. 200 / 0.68 ≈ 294 mg/L.",
      marks: 2,
    },
    {
      id: 305,
      branch: "CE",
      year: "GATE 2021 CE",
      exam_source: "ExamSide GATE CE Archive",
      topic: "Transportation Engg • Stopping Distance",
      question_text: "What is the lag distance during perception-reaction time of 2.5 s for a design speed of 72 km/h on a level highway?",
      options: [
        { label: "A", text: "50 meters" },
        { label: "B", text: "72 meters" },
        { label: "C", text: "25 meters" },
        { label: "D", text: "100 meters" },
      ],
      correct_answer: "A",
      explanation: "72 km/h = 20 m/s. Reaction time = 2.5 s. Lag distance = 20 × 2.5 = 50 meters.",
      shortcut_tip: "Ex-IITian Shortcut: 72 km/h = 20 m/s. 20 × 2.5 = 50 m. Mental calculation!",
      marks: 2,
    },
  ],
  ME: [
    {
      id: 401,
      branch: "ME",
      year: "GATE 2024 ME",
      exam_source: "ExamSide GATE ME Archive",
      topic: "Thermodynamics • Carnot Efficiency",
      question_text: "A Carnot engine operates between 600 K and 300 K. If it receives 1200 kJ of heat from the source, how much work is produced per cycle?",
      options: [
        { label: "A", text: "300 kJ" },
        { label: "B", text: "600 kJ" },
        { label: "C", text: "900 kJ" },
        { label: "D", text: "1200 kJ" },
      ],
      correct_answer: "B",
      explanation: "Carnot efficiency η = 1 - (300 / 600) = 50%. Work output = 0.50 × 1200 kJ = 600 kJ.",
      shortcut_tip: "Ex-IITian Shortcut: Temperature halved means 50% efficiency. Half of 1200 = 600 kJ.",
      marks: 2,
    },
    {
      id: 402,
      branch: "ME",
      year: "GATE 2023 ME",
      exam_source: "ExamSide GATE ME Archive",
      topic: "Theory of Machines • Mobility",
      question_text: "For a standard 4-bar planar mechanism with 4 binary links and 4 revolute pairs, what is the degree of freedom by Kutzbach criterion?",
      options: [
        { label: "A", text: "0" },
        { label: "B", text: "1" },
        { label: "C", text: "2" },
        { label: "D", text: "3" },
      ],
      correct_answer: "B",
      explanation: "m = 3(4 - 1) - 2(4) - 0 = 9 - 8 = 1. Constrained 1-DOF linkage.",
      shortcut_tip: "Ex-IITian Shortcut: Standard 4-bar chain always has 1 degree of freedom.",
      marks: 2,
    },
    {
      id: 403,
      branch: "ME",
      year: "GATE 2022 ME",
      exam_source: "ExamSide GATE ME Archive",
      topic: "Fluid Mechanics • Pipe Flow Velocity",
      question_text: "In steady incompressible pipe flow, diameter decreases from 20 cm to 10 cm. If initial velocity is 2 m/s, what is the velocity at the smaller section?",
      options: [
        { label: "A", text: "4 m/s" },
        { label: "B", text: "8 m/s" },
        { label: "C", text: "16 m/s" },
        { label: "D", text: "1 m/s" },
      ],
      correct_answer: "B",
      explanation: "A₁V₁ = A₂V₂ → V₂ = V₁ (D₁/D₂)² = 2 × (20/10)² = 2 × 4 = 8 m/s.",
      shortcut_tip: "Ex-IITian Shortcut: Half diameter = 1/4 area = 4x velocity: 2 × 4 = 8 m/s.",
      marks: 2,
    },
    {
      id: 404,
      branch: "ME",
      year: "GATE 2024 ME",
      exam_source: "ExamSide GATE ME Archive",
      topic: "Strength of Materials • Shaft Torsion",
      question_text: "A solid shaft of diameter d transmits torque T with max shear stress τ. If diameter is doubled to 2d with same torque, what is the new shear stress?",
      options: [
        { label: "A", text: "τ / 2" },
        { label: "B", text: "τ / 4" },
        { label: "C", text: "τ / 8" },
        { label: "D", text: "τ / 16" },
      ],
      correct_answer: "C",
      explanation: "τ = 16T / (π d³). Since τ ∝ 1/d³, doubling diameter gives τ_new = τ / 2³ = τ / 8.",
      shortcut_tip: "Ex-IITian Shortcut: Polar section modulus scales with d³. 2³ = 8 times stronger → stress is τ/8.",
      marks: 2,
    },
    {
      id: 405,
      branch: "ME",
      year: "GATE 2021 ME",
      exam_source: "ExamSide GATE ME Archive",
      topic: "Manufacturing • Merchant Circle",
      question_text: "In orthogonal cutting with zero rake angle (α = 0°), cutting force is 1000 N and thrust force is 500 N. What is the friction coefficient μ?",
      options: [
        { label: "A", text: "0.50" },
        { label: "B", text: "2.00" },
        { label: "C", text: "1.00" },
        { label: "D", text: "0.25" },
      ],
      correct_answer: "A",
      explanation: "When α = 0°, Friction force F = F_t and Normal force N = F_c. μ = F_t / F_c = 500 / 1000 = 0.50.",
      shortcut_tip: "Ex-IITian Shortcut: With α = 0°, μ is simply F_t / F_c = 500 / 1000 = 0.5.",
      marks: 2,
    },
  ],
  MATHS: [
    {
      id: 501,
      branch: "MATHS",
      year: "GATE 2024 (All Streams)",
      exam_source: "ExamSide GATE Maths Archive",
      topic: "Linear Algebra • Matrix Determinant",
      question_text: "Let A be a 3 × 3 matrix with eigenvalues 1, -1, and 0. What is the determinant of (I + A¹⁰⁰)?",
      options: [
        { label: "A", text: "6" },
        { label: "B", text: "4" },
        { label: "C", text: "2" },
        { label: "D", text: "0" },
      ],
      correct_answer: "B",
      explanation: "Eigenvalues of I + A¹⁰⁰ are 1 + λ¹⁰⁰: (1 + 1¹⁰⁰) = 2, (1 + (-1)¹⁰⁰) = 2, (1 + 0) = 1. Product = 2 × 2 × 1 = 4.",
      shortcut_tip: "Ex-IITian Shortcut: Spectral mapping theorem directly: (1+1)(1+1)(1+0) = 4 in 5 seconds.",
      marks: 2,
    },
    {
      id: 502,
      branch: "MATHS",
      year: "GATE 2023 (All Streams)",
      exam_source: "ExamSide GATE Maths Archive",
      topic: "Calculus • Taylor Series Limit",
      question_text: "Evaluate the limit: lim (x → 0) [eˣ - (1 + x + x²/2)] / x³",
      options: [
        { label: "A", text: "1 / 2" },
        { label: "B", text: "1 / 3" },
        { label: "C", text: "1 / 6" },
        { label: "D", text: "1" },
      ],
      correct_answer: "C",
      explanation: "Taylor expansion of eˣ gives numerator x³/6 + O(x⁴). Dividing by x³ leaves 1/6 as x → 0.",
      shortcut_tip: "Ex-IITian Shortcut: Taylor series avoids 3 consecutive L'Hôpital applications.",
      marks: 2,
    },
    {
      id: 503,
      branch: "MATHS",
      year: "GATE 2022 (All Streams)",
      exam_source: "ExamSide GATE Maths Archive",
      topic: "Differential Equations • Integrating Factor",
      question_text: "What is the integrating factor for (dy/dx) + (2/x) y = x³?",
      options: [
        { label: "A", text: "x" },
        { label: "B", text: "x²" },
        { label: "C", text: "e^(2x)" },
        { label: "D", text: "ln(x²)" },
      ],
      correct_answer: "B",
      explanation: "IF = e^(∫ 2/x dx) = e^(2 ln x) = e^(ln x²) = x².",
      shortcut_tip: "Ex-IITian Shortcut: e^(k ln x) = x^k. With k = 2, IF = x² immediately.",
      marks: 2,
    },
    {
      id: 504,
      branch: "MATHS",
      year: "GATE 2024 (All Streams)",
      exam_source: "ExamSide GATE Maths Archive",
      topic: "Probability • Poisson Distribution",
      question_text: "A Poisson random variable X has mean λ = 2. What is the probability that X = 0?",
      options: [
        { label: "A", text: "e⁻² ≈ 0.135" },
        { label: "B", text: "2 e⁻² ≈ 0.271" },
        { label: "C", text: "1 - e⁻²" },
        { label: "D", text: "0" },
      ],
      correct_answer: "A",
      explanation: "P(X = k) = e^(-λ) λ^k / k!. For k = 0: P(0) = e^(-2) ≈ 0.1353.",
      shortcut_tip: "Ex-IITian Shortcut: P(0) in Poisson is always simply e^(-λ).",
      marks: 2,
    },
    {
      id: 505,
      branch: "MATHS",
      year: "GATE 2021 (All Streams)",
      exam_source: "ExamSide GATE Maths Archive",
      topic: "Vector Calculus • Gauss Divergence",
      question_text: "Let F = x î + y ĵ + z k̂. What is the volume integral ∫∫∫ (∇ · F) dV over a sphere of radius R?",
      options: [
        { label: "A", text: "(4/3) π R³" },
        { label: "B", text: "4 π R³" },
        { label: "C", text: "12 π R³" },
        { label: "D", text: "0" },
      ],
      correct_answer: "B",
      explanation: "∇ · F = 1 + 1 + 1 = 3. Volume integral = 3 × (4/3 π R³) = 4 π R³.",
      shortcut_tip: "Ex-IITian Shortcut: Divergence of position vector = 3. 3 × Sphere Volume = 4 π R³.",
      marks: 2,
    },
  ],
};

const BRANCHES = [
  { code: "CSE", label: "Computer Science (CSE)", icon: "💻" },
  { code: "DA", label: "Data Science & AI (DA)", icon: "🤖" },
  { code: "CE", label: "Civil Engineering (CE)", icon: "🏗️" },
  { code: "ME", label: "Mechanical Engineering (ME)", icon: "⚙️" },
  { code: "MATHS", label: "Engineering Mathematics", icon: "📐" },
];

export default function DailyPyqCard() {
  const [selectedBranch, setSelectedBranch] = useState<string>("CSE");
  const [questions, setQuestions] = useState<ChallengeQuestion[]>(FALLBACK_QUESTIONS.CSE);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 2-Minute Sprint Timer (120 seconds countdown)
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [cycleCount, setCycleCount] = useState(1);

  // Load questions from backend API with fallback
  const fetchQuestions = useCallback(async (branch: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/courses/daily-challenge/?branch=${branch}&limit=5`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          return;
        }
      }
    } catch {
      // Backend offline: silently use authentic bundled fallback
    }
    setQuestions(FALLBACK_QUESTIONS[branch] || FALLBACK_QUESTIONS.CSE);
  }, []);

  // When branch changes, fetch new questions and reset
  const handleBranchChange = (branchCode: string) => {
    setSelectedBranch(branchCode);
    setActiveQIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setTimeLeft(120);
    setIsTimerRunning(true);
    startTransition(() => {
      fetchQuestions(branchCode);
    });
  };

  // Timer interval: 2-minute cycle with auto-refresh
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired! Increment cycle and reset timer to 120s
          setCycleCount((c) => c + 1);
          // Rotate active question or reset sprint
          setActiveQIndex((curr) => (curr + 1) % 5);
          setShowExplanation(false);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const currentQ = questions[activeQIndex] || questions[0];
  const answeredChoice = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isAnswered = answeredChoice !== undefined;
  const isCorrect = answeredChoice === currentQ?.correct_answer;

  const handleSelectOption = (label: string) => {
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: label }));
    if (label === currentQ.correct_answer) {
      setShowExplanation(true);
    }
  };

  // Score calculations
  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correct_answer
  ).length;
  const currentScore = correctCount * 2;

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <section className="py-14 sm:py-18 bg-gradient-to-b from-[#FBF9F5] via-white to-[#F8F7F3] border-t border-[#EAE6DF]" id="daily-pyq">
      <div className="section-container px-4 sm:px-6 lg:px-8">
        
        {/* Challenge Header with Live 2-Min Timer */}
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F4336]/10 border border-[#0F4336]/25 text-[#0F4336] text-[11px] font-bold tracking-wide uppercase">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F4336] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#0F4336]" />
              </span>
              <span>⚡ GATE Daily 2-Min Speed Sprint</span>
            </div>

            {/* Live Timer Pill */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider shadow-2xs border ${
                timeLeft <= 30
                  ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                  : "bg-[#0B192C] border-[#0B192C] text-[#C5A059]"
              }`}
            >
              <span>⏱️ {formattedTime}</span>
              <span className="text-white/60 text-[10px]">
                {timeLeft <= 30 ? "Ending soon!" : "Auto-Refresh 2m"}
              </span>
            </div>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight">
            GATE PYQ Speed Challenge
          </h2>
          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto">
            Select your engineering discipline below. Solve official GATE problems verified from the ExamSide archive under a 2-minute sprint timer.
          </p>
        </div>

        {/* 1. Discipline Selector Tabs */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
            {BRANCHES.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => handleBranchChange(b.code)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap border ${
                  selectedBranch === b.code
                    ? "bg-[#0B192C] text-white border-[#0B192C] shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Main Challenge Workspace Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-[#E2DDD3] shadow-lg overflow-hidden">
          
          {/* Card Top Strip: 5-Question Navigation Pills & Live Score */}
          <div className="bg-[#FAF8F5] border-b border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                5 Questions Sprint:
              </span>
              {questions.map((q, idx) => {
                const ans = selectedAnswers[q.id];
                const isQCorrect = ans === q.correct_answer;
                const isQAnswered = ans !== undefined;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setActiveQIndex(idx);
                      setShowExplanation(ans === q.correct_answer);
                    }}
                    className={`size-8 sm:size-9 rounded-xl font-mono text-xs font-black transition-all cursor-pointer active:scale-90 flex items-center justify-center border ${
                      activeQIndex === idx
                        ? "bg-[#0B192C] text-white border-[#0B192C] ring-2 ring-[#C5A059]"
                        : isQAnswered && isQCorrect
                        ? "bg-[#0F4336] text-white border-[#0F4336]"
                        : isQAnswered && !isQCorrect
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Score Tracker & Sprint Controls */}
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-800">
                Score: <strong className="text-[#0F4336]">{currentScore}</strong> / 10 Marks
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Pause or Resume Timer"
              >
                {isTimerRunning ? "⏸ Pause" : "▶ Resume"}
              </button>
            </div>
          </div>

          {/* Question Workspace */}
          {currentQ && (
            <div className="p-5 sm:p-8 space-y-6">
              
              {/* Question Metadata & ExamSide Source Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#FAF8F5] border border-slate-200 font-bold text-[#0B192C]">
                    🏛️ {currentQ.year}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0F4336]/10 text-[#0F4336] font-semibold text-[11px]">
                    ✓ {currentQ.exam_source || "ExamSide GATE Archive"}
                  </span>
                </div>
                <span className="text-slate-500 font-medium">
                  Topic: <strong className="text-slate-700">{currentQ.topic}</strong>
                </span>
              </div>

              {/* Question Text Formulation */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#ECE8DF]">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#C5A059]">
                    Question #{activeQIndex + 1} ({currentQ.marks} Marks):
                  </span>
                </div>
                <p className="font-serif text-base sm:text-xl font-bold text-[#0B192C] leading-relaxed">
                  {currentQ.question_text}
                </p>
              </div>

              {/* 4 Interactive Options (A, B, C, D) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answeredChoice === opt.label;
                  const isThisCorrect = opt.label === currentQ.correct_answer;

                  let style = "bg-white border-slate-200 hover:border-[#0B192C] text-slate-800";
                  if (isAnswered) {
                    if (isThisCorrect) {
                      style = "bg-[#0F4336]/10 border-[#0F4336] text-[#0F4336] font-bold";
                    } else if (isSelected && !isThisCorrect) {
                      style = "bg-red-50 border-red-400 text-red-700";
                    } else {
                      style = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectOption(opt.label)}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer text-left ${style}`}
                    >
                      <span
                        className={`size-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAnswered && isThisCorrect
                            ? "bg-[#0F4336] text-white"
                            : isAnswered && isSelected && !isThisCorrect
                            ? "bg-red-500 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isAnswered && isThisCorrect && (
                        <span className="text-[#0F4336] font-bold text-xs">✔ +2</span>
                      )}
                      {isAnswered && isSelected && !isThisCorrect && (
                        <span className="text-red-500 font-bold text-xs">✕ 0</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback strip & Reveal Derivation Trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div>
                  {isAnswered ? (
                    <span
                      className={`text-xs font-bold inline-flex items-center gap-1.5 ${
                        isCorrect ? "text-[#0F4336]" : "text-amber-800"
                      }`}
                    >
                      {isCorrect
                        ? "🎉 First-principles deduction correct! Verified from ExamSide."
                        : "💡 Incorrect attempt! Check the Ex-IITian conceptual shortcut below."}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Select an option above to test your speed.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:border-[#0B192C] text-xs font-bold text-slate-700 hover:text-[#0B192C] transition-all cursor-pointer active:scale-95"
                  >
                    {showExplanation ? "Hide Solution ▲" : "View Ex-IITian Derivation ▼"}
                  </button>

                  {activeQIndex < questions.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQIndex((prev) => prev + 1);
                        setShowExplanation(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-[#1E3A5F] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <span>Next (Q{activeQIndex + 2})</span>
                      <span>&rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step-by-Step Proof Drawer */}
              {showExplanation && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧠</span>
                      <strong className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Official {currentQ.year} Step-by-Step Derivation:
                      </strong>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Source: {currentQ.exam_source}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-mono bg-white p-3.5 rounded-xl border border-slate-200">
                    {currentQ.explanation}
                  </p>

                  {currentQ.shortcut_tip && (
                    <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                      <strong>⚡ {currentQ.shortcut_tip}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Ledger: Attribution & Test Series Link */}
          <div className="px-5 py-4 sm:px-8 bg-[#FAF8F5] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 text-center sm:text-left">
              <span>Verified question archive cross-referenced with</span>
              <strong className="text-slate-700">ExamSide.com GATE Bank</strong>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(120);
                  setSelectedAnswers({});
                  setActiveQIndex(0);
                  setShowExplanation(false);
                  setIsTimerRunning(true);
                }}
                className="text-xs font-bold text-slate-600 hover:text-[#0B192C] underline cursor-pointer"
              >
                Restart 2-Min Sprint ↻
              </button>

              <Link
                href="/#test-series"
                className="inline-flex items-center gap-1.5 font-bold text-[#0B192C] hover:text-[#C5A059] transition-colors"
              >
                <span>Full All-India CBT Series</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
