# Meta Ads ML Infrastructure - Deep Technical Knowledge Base

> Last updated: 2026-03-29
> Sources: Meta Engineering Blog, Meta AI Research, ArXiv papers, industry analyses

---

## TABLE OF CONTENTS

1. [System Overview: The Ad Delivery Pipeline](#1-system-overview)
2. [The Ad Auction Mechanism](#2-ad-auction)
3. [DLRM: Deep Learning Recommendation Model (Foundation)](#3-dlrm)
4. [Wukong: Scaling Law Architecture](#4-wukong)
5. [GEM: Generative Ads Recommendation Model](#5-gem)
6. [Andromeda: Next-Gen Retrieval Engine](#6-andromeda)
7. [Meta Lattice: Multi-Task Unified Architecture](#7-lattice)
8. [Sequence Learning: Temporal Behavior Modeling](#8-sequence-learning)
9. [Hardware: MTIA Custom Silicon + NVIDIA Grace Hopper](#9-hardware)
10. [Inference Infrastructure at Scale](#10-inference)
11. [ML Prediction Robustness & Calibration](#11-robustness)
12. [Knowledge Transfer Architecture](#12-knowledge-transfer)
13. [Zoomer: AI Performance Optimization](#13-zoomer)
14. [The Learning Phase & Pacing System](#14-learning-phase)
15. [Signals & Features That Feed the System](#15-signals)
16. [Performance Metrics & Results](#16-metrics)
17. [Timeline & Evolution](#17-timeline)

---

## 1. SYSTEM OVERVIEW: THE AD DELIVERY PIPELINE {#1-system-overview}

Meta's ad delivery system is a multi-stage funnel that processes billions of ad auction requests daily across Facebook, Instagram, Messenger, and Audience Network. The pipeline operates in three major phases:

### Stage 1: Retrieval (Andromeda)
- Starts with tens of millions of active ad candidates
- Narrows to ~1,000 relevant candidates per user per impression
- Uses lightweight but powerful GPU-accelerated models
- 10,000x increase in model complexity vs. previous CPU-based retrieval

### Stage 2: Ranking (GEM + Vertical Models)
- Takes ~1,000 candidates from retrieval
- Applies deep ranking models to score each candidate
- Predicts multiple objectives: click probability, conversion probability, engagement, ad quality
- Uses DLRM-evolved architecture with Wukong factorization machines
- Final ranking formula: Total Value = (Advertiser Bid x Estimated Action Rate) + User Value

### Stage 3: Auction & Delivery
- Runs Vickrey-Clarke-Groves (VCG) inspired auction
- Winner determined by Total Value, not just bid amount
- Pacing system controls spend rate across campaign lifetime
- Budget optimization distributes spend across time periods

### Key Systems in the Pipeline
| System | Role | Hardware | Scale |
|--------|------|----------|-------|
| Andromeda | Retrieval (stage 1) | NVIDIA Grace Hopper + MTIA | Tens of millions -> ~1,000 candidates |
| GEM | Foundation model (teacher) | Thousands of GPUs for training | Largest RecSys foundation model |
| Vertical Models | Production ranking (students) | MTIA + GPU inference | Real-time millisecond inference |
| Meta Lattice | Multi-task ranking | GPU/MTIA | Trillions of parameters |
| Sequence Learning | Temporal modeling | GPU | Thousands of behavioral events |

---

## 2. THE AD AUCTION MECHANISM {#2-ad-auction}

### Total Value Formula

Every time a user opens Facebook or Instagram, an instant ad auction runs. The winning ad is determined by:

```
Total Value = (Advertiser Bid x Estimated Action Rate) + Ad Quality Score
```

### Three Components

**1. Advertiser Bid**
- How much the advertiser is willing to pay for the desired result
- Can be manual (cost cap, bid cap) or automated (lowest cost, highest value)
- In automated bidding, Meta's ML adjusts bids in real-time

**2. Estimated Action Rate (EAR)**
- ML-predicted probability that the user will take the desired action
- Actions: click, view, add-to-cart, purchase, lead form submit, app install
- Predicted via deep learning models (GEM/Vertical Models)
- Updated continuously as new data arrives
- Uses 1,000+ signals per prediction
- Calibrated to match real-world conversion probabilities

**3. Ad Quality Score (1-10 scale)**
- Positive engagement signals: likes, comments, shares, saves
- Negative engagement signals: hide ad, report ad, "not interested"
- Landing page experience: load time, bounce rate, dwell time
- Ad relevance to the target audience
- Post-click behavior quality

### Pacing Multiplier
- A system called "pacing" adjusts Total Value via a pacing multiplier
- Ensures campaign budget is not exhausted too early
- Uses forecasting to predict future auction opportunities
- Adjusts bid multiplier up/down to match desired spend rate
- Daily budgets can limit pacing flexibility; campaign-level budgets preferred

### Why a High-Quality Ad Can Beat a Higher Bid
A $5 bid with 10% EAR and quality score 8 = $5 x 0.10 + 8 = 8.5
A $20 bid with 1% EAR and quality score 3 = $20 x 0.01 + 3 = 3.2
The $5 ad wins.

---

## 3. DLRM: DEEP LEARNING RECOMMENDATION MODEL {#3-dlrm}

### Background
Published by Meta in 2019 (Naumov et al., arXiv:1906.00091). DLRM became the foundation architecture for Meta's ad ranking system and the most widely adopted deep learning recommendation model in the industry.

### Architecture Components

```
Input Features
    |
    +-- Dense Features (continuous) --> Bottom MLP --> Dense Embedding (d-dim)
    |
    +-- Sparse Features (categorical) --> Embedding Tables --> Sparse Embeddings (d-dim each)
    |
    v
Feature Interaction Layer (pairwise dot products)
    |
    v
Concatenate: [Bottom MLP output, Interaction results]
    |
    v
Top MLP
    |
    v
Sigmoid --> Prediction (pCTR/pCVR)
```

**1. Embedding Tables (Sparse Features)**
- Each categorical feature (user ID, ad ID, location, device, etc.) maps to a dense embedding vector
- Uses one-hot or multi-hot encoding -> lookup in embedding table
- Embedding dimension: d (typically 16-128)
- Tables can be enormous: billions of rows for user/item IDs
- Major memory bottleneck; requires model parallelism

**2. Bottom MLP (Dense Features)**
- Processes continuous features: age, time spent, scroll depth, etc.
- Series of affine transformations + nonlinear activations (ReLU)
- Output: d-dimensional vector aligned with embedding outputs

**3. Feature Interaction Layer**
- Computes pairwise dot products between all embedding vectors (dense + sparse)
- Inspired by factorization machines
- Only upper-triangular interactions considered (avoids redundancy)
- Captures second-order feature interactions efficiently

**4. Top MLP**
- Takes concatenation of bottom MLP output + interaction results
- Produces final prediction via sigmoid activation
- Binary classification: click/no-click, convert/no-convert

### Parallelization Strategy
- **Model Parallelism**: For embedding tables (too large for single device memory)
- **Data Parallelism**: For dense computation (Bottom MLP, Top MLP, interactions)
- Specialized all-to-all communication for embedding lookups across devices

### Limitations That Led to Evolution
- Only captures second-order feature interactions
- No temporal/sequential modeling
- No cross-surface learning
- Cannot scale interaction order without architectural changes
- These limitations drove development of Wukong, GEM, and Sequence Learning

---

## 4. WUKONG: SCALING LAW ARCHITECTURE {#4-wukong}

### Background
Meta AI research paper (arXiv:2403.02545, 2024). First architecture to demonstrate scaling laws for recommendation systems comparable to LLMs (GPT-3/LLaMA-2 scale).

### Core Innovation
Purely based on stacked factorization machines, capturing any-order feature interactions through layer stacking. Each layer doubles the maximum interaction order exponentially:
- Layer 1: orders 1-2
- Layer 2: orders 1-4
- Layer 3: orders 1-8
- Layer L: orders 1-2^L

### Architecture Components

**1. Embedding Layer**
- Transforms all features (categorical + dense) into standardized d-dimensional embeddings
- Produces tensor X_0 in R^(n x d) where n = number of features

**2. Interaction Stack (L layers)**
Each layer contains two parallel blocks:

**Factorization Machine Block (FMB)**:
- Computes pairwise dot products between embedding vectors
- Produces n x n interaction matrix
- Uses low-rank approximation: projection matrix Y in R^(n x k), reducing O(n^2 d) to O(nkd)
- Flattens, processes through MLP with layer normalization
- Reshapes to nF output embeddings

**Linear Compression Block (LCB)**:
- Linear recombination: LCB(Xi) = Wl * Xi
- Does NOT increase interaction order
- Maintains lower-order information through layers

**Layer combination**:
```
X(i+1) = LayerNorm(concat(FMB_i(X_i), LCB_i(X_i)) + X_i)
```
Residual connections + layer normalization for stable training.

**3. Output MLP**
- Maps final interaction results to prediction

### Dense Scaling Strategy
Unlike traditional approaches that scale by expanding embedding tables (sparse/memory-bound), Wukong scales via:
- More interaction layers (L)
- More FM output embeddings (nF)
- Larger LCB compression (nL)
- Higher projection rank (k)
- Deeper internal MLPs

This aligns with GPU compute improvements rather than memory bandwidth.

### Scaling Law Results
- Continuous quality improvement across 2 orders of magnitude
- ~0.1% improvement per 4x compute increase
- Achieves scaling beyond 100 GFLOP/example
- Comparable to GPT-3/LLaMA-2 training compute profiles

### Comparison to DLRM
| Aspect | DLRM | Wukong |
|--------|------|--------|
| Interaction Order | 2nd order only | Up to 2^L order |
| Scaling | Sparse (embedding tables) | Dense (compute) |
| Interaction Type | Element-wise | Embedding-wise (atomic) |
| MLP Role | Captures interactions | Transforms interaction results |
| Scaling Law | Not demonstrated | Demonstrated |

---

## 5. GEM: GENERATIVE ADS RECOMMENDATION MODEL {#5-gem}

### Overview
GEM (launched early 2025, expanded throughout the year) is Meta's most advanced ads foundation model. It is the largest foundation model for recommendation systems (RecSys) in the industry, trained at the scale of large language models using thousands of GPUs.

**Important clarification**: GEM stands for "Generative Ads Recommendation Model" -- NOT "GPU-based Execution Module." The "generative" refers to the LLM-inspired paradigm for generating recommendations.

### Architecture: Three Complementary Systems

**1. Non-Sequence Feature Processing (Enhanced Wukong)**
- Stackable factorization machines with cross-layer attention connections
- Vertical scaling: deeper layers discover increasingly complex patterns
  - Early layers: basic correlations (e.g., young professionals -> tech ads)
  - Deep layers: refined understanding considering location, interests, context
- Horizontal scaling: broader feature coverage per layer
- Captures any-order feature interactions exponentially

**2. Sequence Feature Processing (Pyramid-Parallel Structure)**
- Multiple parallel interaction modules in pyramid formation
- Bottom level: chunks behavior history into segments
- Middle levels: combines chunks into broader patterns
- Top level: synthesizes complete user journey understanding
- Processes thousands of past user actions (vs. 10-20 in previous systems)
- Reveals long-term behavioral patterns invisible to traditional systems
- Minimal storage overhead despite massive sequence lengths

**3. Cross-Feature Learning (InterFormer)**
- Alternates between sequence learning layers and cross-feature interaction layers
- Parallel summarization with interleaving structure
- Preserves full sequence information (does NOT compress to summary vectors)
- Enables cross-feature interactions without losing behavioral details
- Each cycle refines understanding without discarding the complete record

### What GEM Learns From
- Ad content and creative features
- User engagement data from ads
- User engagement data from organic content
- Cross-surface interactions (Facebook, Instagram, Messenger)
- Billions of user-ad interactions daily
- Very sparse conversion signals (learning from imbalanced data)

### Feature Categories
- **Sequence features**: Activity history, engagement sequences, purchase journeys
- **Non-sequence features**: User attributes (age, location), ad attributes (format, creative)

### Multi-Task, Multi-Domain Optimization
GEM simultaneously optimizes across:
- Multiple objectives: awareness, engagement, conversion
- Multiple advertiser goals: ROAS, lead generation, app installs
- Diverse data streams: creative formats, measurement signals, user behaviors
- Multiple delivery surfaces: Facebook Feed, Instagram, Reels, Stories, Messaging
- Cross-surface learning: insights from Instagram video ads improve Facebook Feed predictions

### Training Infrastructure

**Distributed Training Strategy:**
- Hybrid Sharded Distributed Parallel (HSDP) for dense model components
- Two-dimensional parallelism for sparse embedding tables (data + model parallelism)
- Optimized for synchronization efficiency and memory locality

**GPU Optimizations:**
- Custom in-house GPU kernels for variable-length (jagged) user sequences
- Computation fusion leveraging latest hardware features
- PyTorch 2.0 graph-level compilation
- Activation checkpointing for memory savings
- Operator fusion for improved execution efficiency
- FP8 quantization for activations
- Unified embedding formats to reduce memory footprint
- NCCLX (Meta's NCCL fork) -- communication collectives WITHOUT using Streaming Multiprocessor resources, eliminating compute-communication contention

**Training Efficiency Results:**
- 23x increase in effective training FLOPs using 16x more GPUs
- 1.43x increase in Model FLOPS Utilization (MFU)
- 5x reduction in job startup time
- 7x reduction in PyTorch 2.0 compilation time via caching
- Q3 2025: doubled performance benefit from adding data/compute (improved scaling laws)

### GEM is NOT Used Directly for Real-Time Inference
GEM is too computationally expensive for real-time ad serving. Instead:
1. GEM trains as the "master teacher"
2. Knowledge transfers to smaller Vertical Models (VMs)
3. VMs serve in production with millisecond latency
4. Continuous online training refreshes the foundation models
5. Updated knowledge flows to VMs via post-training techniques

### GEM is 4x More Efficient
- 4x more efficient at driving ad performance gains per unit of data and compute vs. previous generation models

### Current Scope and Roadmap
- Current: Tabular + sequential data
- Next: Multimodal training (text, images, audio, video)
- Future: Inference-time scaling, agentic capabilities for advertiser automation
- Vision: Unified model ranking both organic content and ads

---

## 6. ANDROMEDA: NEXT-GEN RETRIEVAL ENGINE {#6-andromeda}

### Overview
Introduced late 2024, global rollout completed October 2025. Andromeda is the first stage in the ad delivery funnel -- it decides which ads are ELIGIBLE to be shown.

### Paradigm Shift: Creative-First, Not Audience-First
- Traditional: Advertiser defines audience -> system finds matching ads
- Andromeda: Evaluates historical engagement, ad copy, creative, format FIRST -> predicts which users will engage
- Fundamentally shifts Meta from audience-first to creative-first advertising

### Hardware Co-Design

**NVIDIA Grace Hopper Superchip:**
- Deep neural network with massive parallelism
- GPU preprocessing for feature extraction
- All precomputed ad embeddings stored in local Grace Hopper memory
- High-bandwidth CPU-GPU interconnection for rapid inference
- Solves "limited CPU-to-GPU interconnect bandwidth" bottleneck

**MTIA (Meta Training and Inference Accelerator):**
- Custom Meta silicon co-designed with ML models
- Handles inference workloads alongside NVIDIA hardware

### Model Architecture

**Hierarchical Structured Neural Network:**
- Multi-layered hierarchical index jointly trained with retrieval models
- Sub-linear inference costs (NOT linear in number of ads)
- Enables scaling to much higher model capacity
- Handles millions of ad variants efficiently

**Model Elasticity:**
- Segment-aware design: higher complexity models for high-value ad segments
- Automatically adjusts complexity and inference steps based on available resources
- Real-time resource allocation optimization
- 10x model inference efficiency boost

### Performance Metrics
- 10,000x increase in model complexity vs. previous CPU-based retrieval
- 100x improvement in feature extraction latency and throughput vs. CPU
- 6% recall improvement in retrieval
- 8% ads quality improvement on selected segments
- 3x+ enhancement in end-to-end inference QPS
- Processes 15+ million new ad creatives monthly

### Andromeda + GEM: How They Work Together
- **Andromeda** decides what CAN be shown (retrieval/eligibility)
- **GEM** determines what SHOULD be shown next (ranking/optimization)
- Analogy: Andromeda puts ads on the shelf; GEM determines what gets featured

### Operational Details
- Deep kernel fusion minimizes dispatch overhead
- Advanced software pipelining avoids HBM-SRAM memory IO bottlenecks
- Dynamically reconstructs latent user-ad interaction signals on-the-fly

### Future Target
- Another 1,000x increase in model complexity planned
- Autoregressive loss functions
- Integration with next-gen custom hardware

---

## 7. META LATTICE: MULTI-TASK UNIFIED ARCHITECTURE {#7-lattice}

### Overview
Meta Lattice consolidates hundreds of previously siloed prediction models into a single unified architecture. Published 2022-2023, deployed across Meta's ad systems.

### Architecture
- Customized Deep and Hierarchical Ensemble Network built on Transformer backbones
- Trillions of parameters
- Trained on hundreds of billions of examples
- Spans thousands of data domains

### Multi-Domain, Multi-Task Learning
- Multi-domain, multi-task learning with sparse activation techniques
- Understands both advertiser objectives and user objectives simultaneously
- Critical for cold start: enables relevant ad recommendations for new products with limited history

### Key Technical Components

**1. Delayed Feedback Handling**
- Multi-distribution modeling with temporal awareness
- Captures real-time engagement signals (clicks, likes) in seconds
- Captures delayed conversions spanning hours to days
- Separate temporal modeling for each feedback type

**2. Multi-Objective Balancing**
- Pareto-front feature selection
- MetaBalance technique for automatic tuning
- Eliminates manual tuning across thousands of domains and dozens of objectives
- Achieves Pareto optimality automatically

**3. Two-Level Resource Sharing**
- **Horizontal sharing**: Across domains, objectives, and ranking stages through joint optimization
- **Hierarchical sharing**: Large upstream models -> lightweight downstream vertical models

### Performance Results
- ~8% improvement in ad quality (Instagram)
- ~12% increase in ad quality overall
- Up to 6% increase in ad conversions
- Knowledge sharing across surfaces: Feed, Stories, Reels

---

## 8. SEQUENCE LEARNING: TEMPORAL BEHAVIOR MODELING {#8-sequence-learning}

### Overview
Published November 2024 on Meta Engineering Blog. Represents a paradigm shift from static feature-based DLRM to temporal sequence-based modeling.

### Why Sequences Matter
Traditional DLRMs aggregate user behavior into static features, losing:
- Sequential order information
- Granular event collocations
- Temporal dynamics and behavioral evolution
- Patterns that require understanding event ordering

### Architecture Components

**1. Event-Based Features (EBFs)**
Standardize inputs across three dimensions:
- Event streams: engagement sequences (what the user did)
- Sequence length: how many recent events to consider
- Event information: semantic and contextual data per event

Replace legacy hand-engineered sparse features as primary model inputs.

**2. Event Model**
- Synthesizes event embeddings from attributes
- Applies timestamp encoding for recency awareness
- Combines into event-level representations
- Similar to how language models embed words, but with vocabulary "many orders of magnitude larger"

**3. Sequence Model**
- State-of-the-art attention mechanisms
- Multi-headed attention pooling
- Reduces computational complexity from O(N^2) to O(M x N) where M is tunable, N is max sequence length

### Scaling Solutions
- **Jagged Tensor Support**: Native PyTorch, GPU kernel optimization, Jagged Flash Attention for variable-length sequences
- **Sequence Length Scaling**: Multi-precision quantization, value-based sampling for longer sequences
- **Semantic Enrichment**: Customized vector quantization for multimodal content embeddings

### Performance
- 2-4% more conversions on select segments
- Improved ads prediction accuracy across the board
- Higher value for advertisers with enhanced infrastructure efficiency

---

## 9. HARDWARE: MTIA + NVIDIA GRACE HOPPER {#9-hardware}

### MTIA (Meta Training and Inference Accelerator)

**Architecture:**
- 8x8 array of Processing Elements (PEs) connected via custom network-on-chip
- RISC-V based processor cores (extensively customized)
- Fixed-function units for matrix multiplication, accumulation, data movement, nonlinear functions
- 256 MB SRAM backed by LPDDR5 DRAM (up to 128 GB)
- Intentionally avoids HBM to reduce cost and power consumption

**Versions:**
- MTIA v1: First-generation inference accelerator
- MTIA v2: Added training capability alongside inference
- MTIA 450/500: Optimized for GenAI inference, also supports ranking/recommendation training and inference

**Workload Focus:**
- Top 5 recommendation models at Meta run on MTIA
- Responsible for significant percentage of Meta's ad revenue
- Deployed across all global datacenter regions
- New chip versions every 6 months via modular, reusable designs

### NVIDIA Grace Hopper Superchip
- Used primarily in Andromeda retrieval system
- High-bandwidth CPU-GPU interconnection
- Local memory stores precomputed ad embeddings and features
- Enables GPU preprocessing for feature extraction
- Powers the 10,000x model complexity increase

### Hardware Strategy
Meta uses a heterogeneous approach:
- MTIA for inference workloads (cost-effective, power-efficient)
- NVIDIA GPUs for training and complex inference
- Grace Hopper for retrieval (high-bandwidth memory needs)
- Continuous co-design between ML models and hardware

---

## 10. INFERENCE INFRASTRUCTURE AT SCALE {#10-inference}

### Scale
- Hundreds of trillions of AI model executions per day
- Every ad impression triggers multiple model inferences
- Models are sharded across multiple hosts

### Sharded Architecture
- Each model is a shard
- Multiple models hosted in a single host
- Job spans multiple hosts
- Client requests trigger multiple model inferences depending on experiment setup, page type, and ad attributes

### Key Infrastructure Components
- **ServiceRouter**: Service discovery, load balancing, reliability
- **Shard Manager**: Shard placement and scaling across heterogeneous hardware
- **ReplicaEstimator**: Estimates replica counts for new model versions

### Critical Bottleneck: Memory Bandwidth
- Memory bandwidth, NOT CPU, is often the real bottleneck
- Memory latency increases exponentially at 65-70% utilization
- CPU spikes during replica placement traced to memory stalls
- Solution: Consider memory bandwidth as a resource during replica placement

### Tail Utilization Optimization (2024)
Results achieved:
- 35% increase in compute capacity without additional hardware
- 66% reduction in timeout error rates
- 50% reduction in p99 latency

Techniques:
- "Power of two choices" load balancing with polling-based freshness
- Per-model load counters (replacing host-level aggregation)
- Shard Manager tuning for placement load balancing
- Predictive replica scaling: predicts future resource usage 2 hours in advance

### Training Efficiency (2024)
- 75% training time reduction for ads relevance models
- 78% reduction in power consumption for training

---

## 11. ML PREDICTION ROBUSTNESS & CALIBRATION {#11-robustness}

### Why Calibration Matters
The Estimated Action Rate must reflect REAL probabilities. If the model predicts 5% conversion probability, roughly 5 out of 100 shown users should actually convert. Miscalibration directly impacts:
- Auction fairness
- Advertiser ROI
- Revenue optimization
- Budget pacing accuracy

### Meta's Three-Pronged Robustness Strategy

**1. Prevention Guardrails (Outside-In Control)**

**Snapshot Validator:**
- Evaluates new model snapshots in real-time before production deployment
- Uses holdout datasets for validation
- 74% reduction in model snapshot corruption over 2 years
- Protects >90% of Meta ads ranking models in production

**2. Fundamental ML Understanding (Inside-Out Insights)**

**Feature Robustness:**
- Continuous anomaly detection monitors ML features
- Detects coverage drops, data corruption, inconsistency
- Real-time feature importance evaluation
- Automated halt of abnormal features before production use

**Training Data Robustness:**
- Dedicated systems detect label drifts with high accuracy
- Automatic mitigation prevents learning from affected training data
- Handles instability from complex logging infrastructure
- Manages organic traffic variations

**3. Technical Fortifications (Intrinsic Robustness)**

**Calibration Robustness:**
- Real-time monitoring and auto-mitigation
- High-precision alert systems minimize detection time
- Automatically orchestrated mitigations
- Handles unjoined-data real-time model training
- Sensitive to traffic distribution shifts (addressed specifically)

**ML Interpretability (Hawkeye):**
- AI debugging toolkit for root-cause analysis
- Covers >80% of ads ML artifacts
- Reduced time to root-cause ML prediction issues by 50%
- Model graph tracing: internal states, activations, neuron importance analysis

### Cold Start Handling
- New ads have limited data for pCTR/pCVR estimation
- Deep learning models work poorly on cold-start ads with new IDs
- Solutions: Graph Meta Embeddings via GNNs + meta-learning
- Meta Lattice's multi-task learning specifically helps cold start by learning across domains

### Bayesian Approach
- Meta's algorithm uses probabilistic ML and Bayesian forecasting
- If priors expected 3% conversion rate but early results show 1%, bid calculations adjust dynamically
- Continuous posterior updating as more data arrives

---

## 12. KNOWLEDGE TRANSFER ARCHITECTURE {#12-knowledge-transfer}

### Why Knowledge Transfer?
GEM is too large and slow for real-time inference. The solution: train a massive foundation model, then transfer its knowledge to smaller production models.

### Two Transfer Strategies

**1. Direct Transfer**
- Knowledge propagates from GEM directly to Vertical Models (VMs)
- Works when VMs operate within GEM's training data domain
- Straightforward teacher -> student distillation

**2. Hierarchical Transfer**
- GEM -> Domain-Specific Foundation Models (FMs) -> Vertical Models (VMs)
- Three-tier cascade for broader knowledge distribution
- Domain FMs act as specialized intermediaries
- Drives improvements across a wider range of production models

### Three Transfer Techniques

**1. Knowledge Distillation with Student Adapter**
- Standard distillation: student learns teacher's reasoning process
- Student Adapter: lightweight component using most recent ground-truth data
- Addresses two key problems:
  - Stale supervision from delays in FM training and evaluation
  - Domain mismatches between GEM/FM predictions and surface-specific objectives
- Adapter refines teacher outputs with fresh, domain-specific data

**2. Representation Learning**
- Automatically derives meaningful, compact features from raw data
- Provides semantically aligned features supporting transfer efficiency
- Critical: adds NO inference overhead to production models
- Shared conceptual frameworks between teacher and students

**3. Parameter Sharing**
- Multiple models reuse specific parameters from foundation models
- Smaller, latency-sensitive VMs leverage rich representations
- Without incurring full computational cost of the foundation model
- Selective incorporation of GEM components for complex tasks

### Effectiveness
- Combined techniques achieve 2x effectiveness of standard knowledge distillation alone

### Continuous Learning Cycle
1. Users interact with fast VMs in real-time
2. Engagement data flows into Meta's data pipelines
3. GEM periodically retrains on fresh data
4. Updated knowledge transfers to VMs via post-training techniques
5. Improved VMs deploy to production
6. Repeat

### GPU Efficiency in Transfer
- Exploration phase: lightweight model variants at much lower cost (supports >50% of experiments)
- Post-training phase: forward passes generate labels and embeddings for downstream models
- Continuous online training to refresh FMs
- Enhanced traffic sharing between training and post-training knowledge generation

---

## 13. ZOOMER: AI PERFORMANCE OPTIMIZATION {#13-zoomer}

### Overview
Zoomer is Meta's automated debugging and optimization platform for all AI workloads. It became the de-facto tool across Meta for GPU workload optimization.

### Scale
- Generates tens of thousands of profiling reports daily
- Works across all model types: ads recommendations, GenAI, computer vision
- Supports both training and inference paradigms
- Meta serves hundreds of trillions of AI model executions per day

### Architecture (Three Layers)
1. **Foundation Layer**: Enterprise-grade scalability using Manifold (blob storage) for trace data
2. **Processing Layer**: Fault-tolerant pipelines for large trace files
3. **Collection Layer**: Low-latency data collection with automatic profiling triggers across thousands of hosts simultaneously

### Relevance to Ads
- Powers optimization of ads ranking model training
- Identifies inefficiencies across hundreds of thousands of GPUs
- Reduces training time
- Enables energy savings
- Provides deep performance insights for ads inference workloads

### Future Directions
- Unified performance insights across heterogeneous hardware (MTIA + GPUs)
- Advanced analyzers for proactive optimization
- Inference performance tuning via serving parameter optimization
- Automated, intuitive tools for all engineers

---

## 14. THE LEARNING PHASE & PACING SYSTEM {#14-learning-phase}

### Learning Phase
When a new ad set launches, Meta's system enters a "learning phase":
- Ads delivered experimentally to explore different audience segments
- System learns optimal audience, bid levels, and pacing
- Requires ~50 conversion events per week per ad set to exit learning phase
- Performance is volatile during this phase
- Exploration-exploitation cycle: balances trying new audiences vs. exploiting known good ones

### Pacing System
- Forecasts how many future auction opportunities will be available
- Adjusts delivery speed in real-time
- "Paced bid" goes up/down to match desired spend rate
- Daily budgets can starve the system of signal density and pacing flexibility
- Campaign-level budgets preferred for optimal pacing

### Exploration-Exploitation Cycle
- **Exploration**: Testing new user segments, placements, creative combinations
- **Exploitation**: Concentrating delivery on proven high-performers
- Balance shifts over time as data accumulates
- Cold start = heavy exploration; mature = heavy exploitation

---

## 15. SIGNALS & FEATURES THAT FEED THE SYSTEM {#15-signals}

### User Signals (1,000+ per prediction)
- **On-platform behavior**: Pages followed, past ad clicks, content viewed, groups joined, events attended
- **Off-platform activity**: Facebook Pixel data, Conversions API (CAPI) data
- **Demographics**: Age, gender, location, language
- **Device**: Type, OS, connection speed, screen size
- **Temporal**: Time of day, day of week, session duration
- **Engagement history**: Full behavioral sequences (thousands of events via Sequence Learning)
- **Purchase journey**: Cross-session and cross-device paths to conversion

### Ad Signals
- Creative content: Image/video features, text, headline, CTA
- Ad format: Single image, carousel, video, collection, etc.
- Campaign objective: Conversions, traffic, awareness, leads
- Historical performance: Past CTR, CVR, engagement rates
- Landing page quality: Load time, bounce rate, content relevance
- Advertiser history: Account quality, past policy compliance

### Contextual Signals
- Placement: Feed, Stories, Reels, Messenger, Audience Network
- Content adjacency: What organic content surrounds the ad
- Competitive landscape: Other ads in the same auction
- Seasonality: Time-based demand patterns

### Cross-Surface Learning
GEM enables learning across all Meta surfaces:
- Instagram video engagement insights improve Facebook Feed predictions
- Reels behavior informs Stories ad ranking
- Messenger interactions contribute to overall user understanding

---

## 16. PERFORMANCE METRICS & RESULTS {#16-metrics}

### GEM Results (2025)
- 5% increase in ad conversions on Instagram
- 3% increase in ad conversions on Facebook Feed
- 4x more efficient at driving performance gains per unit of data/compute
- 23x increase in effective training FLOPs

### Andromeda Results (2024-2025)
- 10,000x increase in retrieval model complexity
- 100x improvement in feature extraction latency vs. CPU
- 6% recall improvement in retrieval
- 8% ads quality improvement
- 3x+ enhancement in inference QPS
- 22% ROAS increase reported by adapted advertisers

### Meta Lattice Results
- ~12% increase in ad quality
- Up to 6% increase in ad conversions
- ~8% improvement on Instagram specifically

### Sequence Learning Results
- 2-4% more conversions on select segments
- 3% increase in conversions (tested segments via Meta for Business)

### Infrastructure Results (2024)
- 75% training time reduction for ads relevance models
- 78% reduction in power consumption
- 35% increase in compute capacity (no new hardware)
- 50% reduction in p99 inference latency
- 66% reduction in timeout errors

---

## 17. TIMELINE & EVOLUTION {#17-timeline}

| Year | Milestone |
|------|-----------|
| 2019 | DLRM published (arXiv:1906.00091) -- foundation architecture |
| 2020-2021 | DLRM deployed at scale, embedding table scaling |
| 2022 | Meta Lattice development -- multi-task unified architecture |
| 2023 | MTIA v1 inference accelerator deployed |
| 2024 Mar | Wukong paper published -- scaling laws for RecSys |
| 2024 Apr | MTIA v2 with training capability |
| 2024 Jul | Tail utilization optimization (35% capacity gain) |
| 2024 Jul | ML prediction robustness framework published |
| 2024 Nov | Sequence Learning paradigm shift published |
| 2024 Dec | Andromeda introduced (Grace Hopper + MTIA) |
| 2025 Q1 | GEM launched across Meta properties |
| 2025 Q2 | GEM delivers 5% Instagram / 3% Facebook conversion gains |
| 2025 Q3 | GEM scaling laws doubled in efficiency |
| 2025 Oct | Andromeda global rollout completed |
| 2025 Nov | GEM engineering blog post published |
| 2025 Nov | Zoomer optimization platform published |
| 2026 Q1 | Advantage+ campaigns become default for Sales/Leads/App |
| 2026 Mar | MTIA 450/500 expanded for GenAI + ranking |
| Future | GEM multimodal, inference-time scaling, agentic capabilities |

---

## SOURCES

### Meta Engineering Blog (Primary)
- [GEM: The Central Brain Accelerating Ads Recommendation AI Innovation](https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/)
- [Meta Andromeda: Supercharging Advantage+ Automation](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/)
- [Sequence Learning: A Paradigm Shift for Personalized Ads](https://engineering.fb.com/2024/11/19/data-infrastructure/sequence-learning-personalized-ads-recommendations/)
- [ML Prediction Robustness at Meta](https://engineering.fb.com/2024/07/10/data-infrastructure/machine-learning-ml-prediction-robustness-meta/)
- [Taming Tail Utilization of Ads Inference at Meta Scale](https://engineering.fb.com/2024/07/10/production-engineering/tail-utilization-ads-inference-meta/)
- [Zoomer: Powering AI Performance at Meta's Scale](https://engineering.fb.com/2025/11/21/data-infrastructure/zoomer-powering-ai-performance-meta-intelligent-debugging-optimization/)

### Meta AI Blog
- [DLRM: An Advanced, Open Source Deep Learning Recommendation Model](https://ai.meta.com/blog/dlrm-an-advanced-open-source-deep-learning-recommendation-model/)
- [AI Ads Performance and Efficiency: Meta Lattice](https://ai.meta.com/blog/ai-ads-performance-efficiency-meta-lattice/)
- [Next Generation MTIA](https://ai.meta.com/blog/next-generation-meta-training-inference-accelerator-AI-MTIA/)
- [MTIA v1: First-Generation AI Inference Accelerator](https://ai.meta.com/blog/meta-training-inference-accelerator-AI-MTIA/)

### Meta for Business
- [AI Innovation in Meta's Ads Ranking Driving Advertiser Performance](https://www.facebook.com/business/news/ai-innovation-in-metas-ads-ranking-driving-advertiser-performance)

### Research Papers
- [DLRM Paper (arXiv:1906.00091)](https://arxiv.org/abs/1906.00091)
- [Wukong: Towards a Scaling Law for Large-Scale Recommendation (arXiv:2403.02545)](https://arxiv.org/abs/2403.02545)
- [MTIA v2: Model-Chip Co-Design (ISCA 2025)](https://dl.acm.org/doi/10.1145/3695053.3731409)

### Industry Analysis
- [How Meta Built a New AI-Powered Ads Model (ByteBytego)](https://blog.bytebytego.com/p/how-meta-built-a-new-ai-powered-ads)
- [Meta GEM and Andromeda Explained (SearchEngineLand)](https://searchengineland.com/meta-ai-driven-advertising-system-andromeda-gem-468020)
- [Meta GEM Details (InfoQ)](https://www.infoq.com/news/2025/12/meta-gem-ads-model/)
- [GEM and Andromeda: New Era of Ad Targeting (Prohed)](https://www.prohed.com/blog/gem-andromeda-metas-new-ad-delivery-and-recommendation-system-explained/)
- [DLRM Architecture Deep Dive (Emergent Mind)](https://www.emergentmind.com/topics/deep-learning-recommendation-model-dlrm)
