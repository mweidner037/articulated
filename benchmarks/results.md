# Benchmark results

Each cell is the 95% confidence interval from 10 trials.

## Trace: kleppmannReal

Editing trace by Martin Kleppmann.

Source: https://github.com/automerge/automerge-perf/blob/master/edit-by-index/editing-trace.js.

Info: https://github.com/automerge/automerge-perf.

### No refreshes

| Algorithm | Mean (μs) | P50 (μs) | P90 (μs) | P99 (μs) | P100 (μs) | Iteration time (μs) | Memory (kB) | Save time (ms) | Load time (ms) | Save size (kB) | Save time GZIP (ms) | Load time GZIP (ms) | Save size GZIP (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| string | 1.58 ± 0.01 | 1.60 ± 0.02 | 2.22 ± 0.02 | 2.57 ± 0.06 | 338 ± 50 | 1.57 ± 0.38 | 105 ± 0 | 0.00326 ± 0.00042 | 0.00560 ± 0.00059 | 105 ± 0 | 2.80 ± 0.02 | 2.70 ± 0.38 | 28.3 ± 0.0 |
| charArray | 3.45 ± 0.02 | 1.83 ± 0.01 | 8.86 ± 0.04 | 10.9 ± 0.1 | 115 ± 10 | 678 ± 17 | 839 ± 0 | 1.52 ± 0.02 | 1.97 ± 0.29 | 105 ± 0 | 4.29 ± 0.04 | 3.71 ± 0.76 | 28.3 ± 0.0 |
| rope | 0.216 ± 0.001 | 0.167 ± 0.000 | 0.333 ± 0.000 | 0.625 ± 0.000 | 586 ± 42 | 82.2 ± 5.5 | 839 ± 0 | 3.29 ± 0.03 | 2.04 ± 0.25 | 105 ± 0 | 6.59 ± 0.07 | 3.95 ± 0.66 | 28.3 ± 0.0 |
| proseMirror | 10.3 ± 0.1 | 8.33 ± 0.10 | 16.6 ± 0.2 | 20.4 ± 0.6 | 16102 ± 557 | 46.9 ± 10.1 | 354 ± 6 | 1.40 ± 0.05 | 3.00 ± 0.57 | 166 ± 0 | 10.0 ± 0.3 | 5.47 ± 0.62 | 30.6 ± 0.0 |
| idList | 1.70 ± 0.01 | 1.60 ± 0.02 | 1.97 ± 0.01 | 3.63 ± 0.04 | 352 ± 33 | 16659 ± 1280 | 2529 ± 0 | 3.03 ± 0.08 | 16.1 ± 1.1 | 871 ± 0 | 18.5 ± 0.2 | 18.6 ± 1.2 | 65.3 ± 0.0 |
| idListCompact | 1.71 ± 0.01 | 1.62 ± 0.01 | 1.98 ± 0.02 | 3.60 ± 0.04 | 357 ± 40 | 17144 ± 226 | 2529 ± 0 | 2.73 ± 0.05 | 15.3 ± 1.2 | 231 ± 0 | 11.5 ± 0.3 | 16.2 ± 0.6 | 34.6 ± 0.0 |
| idListProtobuf | 1.71 ± 0.01 | 1.62 ± 0.01 | 1.98 ± 0.02 | 3.63 ± 0.05 | 355 ± 34 | 17326 ± 225 | 2816 ± 71 | 3.38 ± 0.30 | 17.3 ± 1.2 | 47.4 ± 0.0 | 4.70 ± 0.05 | 18.0 ± 1.6 | 25.3 ± 0.0 |
| automerge | 27.8 ± 0.1 | 27.5 ± 0.1 | 32.1 ± 0.1 | 36.9 ± 0.1 | 4186 ± 39 | 4.19 ± 2.26 |  | 17.1 ± 0.1 | 348 ± 2 | 129 ± 0 | 19.8 ± 0.2 | 349 ± 2 | 129 ± 0 |
| yjsText | 11.4 ± 0.1 | 12.0 ± 0.2 | 13.9 ± 0.2 | 26.1 ± 0.3 | 545 ± 43 | 505 ± 15 | 2977 ± 2 | 5.01 ± 0.09 | 26.2 ± 1.2 | 311 ± 0 | 15.1 ± 0.3 | 28.7 ± 1.1 | 107 ± 0 |

### Refresh every 1000 ops

| Algorithm | Mean (μs) | P50 (μs) | P90 (μs) | P99 (μs) | P100 (μs) | Iteration time (μs) | Memory (kB) | Save time (ms) | Load time (ms) | Save size (kB) | Save time GZIP (ms) | Load time GZIP (ms) | Save size GZIP (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| string | 1.58 ± 0.01 | 1.59 ± 0.02 | 2.20 ± 0.02 | 2.53 ± 0.01 | 326 ± 52 | 3.32 ± 0.57 | 105 ± 0 | 0.00254 ± 0.00044 | 0.00474 ± 0.00060 | 105 ± 0 | 2.79 ± 0.04 | 2.54 ± 0.49 | 28.3 ± 0.0 |
| charArray | 3.53 ± 0.02 | 1.83 ± 0.00 | 8.87 ± 0.05 | 11.0 ± 0.0 | 1141 ± 71 | 609 ± 143 | 839 ± 0 | 1.49 ± 0.03 | 1.89 ± 0.35 | 105 ± 0 | 4.12 ± 0.33 | 3.64 ± 0.76 | 28.3 ± 0.0 |
| rope | 3.47 ± 0.02 | 0.167 ± 0.000 | 1.86 ± 0.03 | 38.9 ± 0.4 | 1645 ± 135 | 476 ± 20 | 839 ± 0 | 2.24 ± 0.04 | 2.02 ± 0.26 | 105 ± 0 | 8.63 ± 0.13 | 3.51 ± 0.73 | 28.3 ± 0.0 |
| proseMirror | 6.06 ± 0.03 | 3.24 ± 0.03 | 11.6 ± 0.1 | 16.8 ± 0.1 | 16175 ± 1131 | 37.7 ± 4.9 | 382 ± 7 | 0.357 ± 0.053 | 3.35 ± 0.58 | 166 ± 0 | 8.95 ± 0.15 | 4.77 ± 0.94 | 30.6 ± 0.0 |
| idList | 1.47 ± 0.03 | 1.34 ± 0.01 | 1.60 ± 0.03 | 4.03 ± 0.35 | 515 ± 39 | 17151 ± 214 | 2612 ± 3 | 2.39 ± 0.09 | 16.2 ± 2.1 | 876 ± 0 | 21.5 ± 1.3 | 20.9 ± 0.8 | 71.9 ± 0.0 |
| idListCompact | 1.45 ± 0.01 | 1.35 ± 0.01 | 1.58 ± 0.00 | 3.81 ± 0.04 | 506 ± 32 | 17328 ± 331 | 2615 ± 0 | 2.05 ± 0.06 | 14.7 ± 0.7 | 218 ± 0 | 10.4 ± 0.9 | 16.8 ± 1.2 | 40.3 ± 0.0 |
| idListProtobuf | 1.44 ± 0.01 | 1.34 ± 0.01 | 1.59 ± 0.01 | 3.81 ± 0.05 | 457 ± 30 | 16965 ± 336 | 2653 ± 0 | 2.78 ± 0.03 | 19.6 ± 4.0 | 40.7 ± 0.0 | 4.31 ± 0.04 | 21.5 ± 4.3 | 25.8 ± 0.0 |
| automerge | 32.0 ± 0.1 | 30.1 ± 0.1 | 35.4 ± 0.1 | 41.4 ± 0.2 | 4095 ± 25 | 2.06 ± 0.40 |  | 17.5 ± 0.2 | 445 ± 7 | 156 ± 0 | 23.5 ± 0.3 | 447 ± 8 | 156 ± 0 |
| yjsText | 10.8 ± 0.1 | 10.0 ± 0.1 | 17.7 ± 0.2 | 29.0 ± 0.6 | 676 ± 26 | 526 ± 20 | 3044 ± 1 | 4.74 ± 0.13 | 28.4 ± 1.6 | 289 ± 0 | 13.1 ± 0.3 | 30.8 ± 1.2 | 117 ± 0 |

# LaTeX Tables

For "Refresh every 1000 ops" data.

## Trace: kleppmannReal

```latex
\begin{table}
  \caption{Memory Usage for the Final Document State}
  \label{tab:memory}
  \begin{tabular}{llc}
    \toprule
    Category & Implementation & Memory Usage (kB) \\
    \midrule
    \multirow{2}{*}{\shortstack[l]{Traditional text-editor \\ data structure}} & String & $\num{105} \pm 0$ \\
    & Character Array & $\num{839} \pm 0$ \\
    & Rope & $\num{839} \pm 0$ \\
    & ProseMirror & $\num{382} \pm 7$ \\
    List of IDs & Articulated & $\num{2615} \pm 0$ \\
    CRDT & Yjs & $\num{3044} \pm 1$ \\
  \bottomrule
\end{tabular}
\end{table}
```

```latex
\begin{table}
  \caption{Storage Metrics for the Final Document State}
  \label{tab:storage}
  \begin{tabular}{llccc}
    \toprule
    Category & Implementation & Saved State Size (kB) & Save Time (ms) & Load Time (ms) \\
    \midrule
    Actual Text & String & $\num{105} \pm 0$ \\
    & String w/ GZIP & $\num{28.3} \pm 0.0$ & $\num{2.79} \pm 0.04$ & $\num{2.54} \pm 0.49$ \\
    List of IDs & Articulated & $\num{218} \pm 0$ & $\num{2.05} \pm 0.06$ & $\num{14.7} \pm 0.7$ \\
    & Articulated w/ GZIP & $\num{40.3} \pm 0.0$ & $\num{10.4} \pm 0.9$ & $\num{16.8} \pm 1.2$ \\
    & Articulated w/ Binary Encoding & $\num{40.7} \pm 0.0$ & $\num{2.78} \pm 0.03$ & $\num{19.6} \pm 4.0$ \\
    CRDT & Automerge & $\num{156} \pm 0$ & $\num{17.5} \pm 0.2$ & $\num{445} \pm 7$ \\
    & Yjs & $\num{289} \pm 0$ & $\num{4.74} \pm 0.13$ & $\num{28.4} \pm 1.6$ \\
  \bottomrule
\end{tabular}
\end{table}
```

```latex
\begin{table}
  \caption{Throughput and Distribution of Operation Times}
  \label{tab:op_times}
  \begin{tabular}{llcccc}
    \toprule
    Category & Implementation & \shortstack{Throughput \\(ops/sec)} & P90 ($\mu$s) & P99 ($\mu$s) & Max ($\mu$s) \\
    \midrule
    \multirow{3}{*}{\shortstack[l]{Traditional text-\\ editor data \\ structure}} & String & $[\num{628}k, \num{636}k]$ & $\num{2.20} \pm 0.02$ & $\num{2.53} \pm 0.01$ & $\num{326} \pm 52$ \\
    & Character Array & $[\num{282}k, \num{285}k]$ & $\num{8.87} \pm 0.05$ & $\num{11.0} \pm 0.0$ & $\num{1141} \pm 71$ \\
    & Rope & $[\num{287}k, \num{289}k]$ & $\num{1.86} \pm 0.03$ & $\num{38.9} \pm 0.4$ & $\num{1645} \pm 135$ \\
    & ProseMirror & $[\num{164}k, \num{166}k]$ & $\num{11.6} \pm 0.1$ & $\num{16.8} \pm 0.1$ & $\num{16175} \pm 1131$ \\
    List of IDs & Articulated & $[\num{685}k, \num{695}k]$ & $\num{1.58} \pm 0.00$ & $\num{3.81} \pm 0.04$ & $\num{506} \pm 32$ \\
    CRDT & Automerge & $[\num{31.1}k, \num{31.3}k]$ & $\num{35.4} \pm 0.1$ & $\num{41.4} \pm 0.2$ & $\num{4095} \pm 25$ \\
    & Yjs & $[\num{92.0}k, \num{93.7}k]$ & $\num{17.7} \pm 0.2$ & $\num{29.0} \pm 0.6$ & $\num{676} \pm 26$ \\
  \bottomrule
\end{tabular}
\end{table}
```
