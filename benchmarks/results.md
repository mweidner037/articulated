# Benchmark results

Each cell is the 95% confidence interval from 10 trials.

## Trace: kleppmannReal

Editing trace by Martin Kleppmann.

Source: https://github.com/automerge/automerge-perf/blob/master/edit-by-index/editing-trace.js.

Info: https://github.com/automerge/automerge-perf.

### No refreshes

| Algorithm | Mean (μs) | P50 (μs) | P90 (μs) | P99 (μs) | P100 (μs) | Iteration time (μs) | Memory (kB) | Save time (ms) | Load time (ms) | Save size (kB) | Save time GZIP (ms) | Load time GZIP (ms) | Save size GZIP (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| string | 1.57 ± 0.02 | 1.60 ± 0.02 | 2.20 ± 0.03 | 2.56 ± 0.05 | 374 ± 47 | 1.43 ± 0.28 | 105 ± 0 | 0.00273 ± 0.00073 | 0.00750 ± 0.00066 | 105 ± 0 | 2.81 ± 0.09 | 2.52 ± 0.52 | 28.3 ± 0.0 |
| charArray | 3.45 ± 0.02 | 1.85 ± 0.01 | 8.84 ± 0.05 | 10.9 ± 0.1 | 129 ± 8 | 768 ± 99 | 839 ± 0 | 1.57 ± 0.04 | 1.89 ± 0.36 | 105 ± 0 | 4.39 ± 0.09 | 3.85 ± 0.81 | 28.3 ± 0.0 |
| rope | 0.216 ± 0.001 | 0.167 ± 0.000 | 0.333 ± 0.000 | 0.625 ± 0.000 | 735 ± 70 | 79.1 ± 9.7 | 839 ± 0 | 3.41 ± 0.10 | 1.75 ± 0.42 | 105 ± 0 | 6.72 ± 0.20 | 3.54 ± 0.81 | 28.3 ± 0.0 |
| proseMirror | 10.2 ± 0.1 | 8.26 ± 0.06 | 16.5 ± 0.1 | 20.2 ± 0.5 | 16311 ± 451 | 42.1 ± 2.6 | 354 ± 7 | 1.42 ± 0.10 | 3.21 ± 0.57 | 166 ± 0 | 9.63 ± 1.05 | 5.36 ± 0.47 | 30.6 ± 0.0 |
| automerge | 27.8 ± 0.1 | 27.4 ± 0.1 | 32.0 ± 0.2 | 37.0 ± 0.2 | 4189 ± 68 | 3.08 ± 0.91 |  | 17.2 ± 0.1 | 348 ± 1 | 129 ± 0 | 19.7 ± 0.1 | 346 ± 3 | 129 ± 0 |
| yjsText | 11.3 ± 0.1 | 11.8 ± 0.2 | 13.7 ± 0.1 | 26.4 ± 0.8 | 650 ± 57 | 560 ± 67 | 2977 ± 1 | 5.02 ± 0.11 | 26.2 ± 2.7 | 309 ± 5 | 14.9 ± 0.2 | 28.6 ± 1.3 | 107 ± 0 |

### Refresh every 1000 ops

| Algorithm | Mean (μs) | P50 (μs) | P90 (μs) | P99 (μs) | P100 (μs) | Iteration time (μs) | Memory (kB) | Save time (ms) | Load time (ms) | Save size (kB) | Save time GZIP (ms) | Load time GZIP (ms) | Save size GZIP (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| string | 1.59 ± 0.01 | 1.59 ± 0.01 | 2.20 ± 0.02 | 2.54 ± 0.01 | 422 ± 82 | 3.09 ± 0.63 | 105 ± 0 | 0.00267 ± 0.00087 | 0.00878 ± 0.00487 | 105 ± 0 | 2.82 ± 0.06 | 2.83 ± 0.16 | 28.3 ± 0.0 |
| charArray | 3.52 ± 0.02 | 1.83 ± 0.02 | 8.85 ± 0.04 | 10.9 ± 0.1 | 1964 ± 398 | 687 ± 25 | 839 ± 0 | 1.58 ± 0.05 | 2.10 ± 0.12 | 105 ± 0 | 4.32 ± 0.05 | 3.94 ± 0.53 | 28.3 ± 0.0 |
| rope | 4.62 ± 0.12 | 0.162 ± 0.009 | 1.87 ± 0.04 | 51.4 ± 1.5 | 3125 ± 471 | 490 ± 24 | 839 ± 0 | 2.32 ± 0.07 | 1.86 ± 0.37 | 105 ± 0 | 8.70 ± 0.13 | 4.16 ± 0.39 | 28.3 ± 0.0 |
| proseMirror | 6.04 ± 0.03 | 3.22 ± 0.02 | 11.5 ± 0.1 | 16.8 ± 0.1 | 16510 ± 1407 | 37.9 ± 3.4 | 382 ± 7 | 0.429 ± 0.076 | 3.20 ± 0.57 | 166 ± 0 | 8.66 ± 0.79 | 4.94 ± 1.14 | 30.6 ± 0.0 |
| idList |  |  |  |  |  |  |  | 2.48 ± 0.18 | 27.6 ± 2.2 | 876 ± 0 | 19.2 ± 2.0 | 33.1 ± 1.7 | 71.9 ± 0.0 |
| idListTransposed |  |  |  |  |  |  |  | 1.57 ± 0.05 | 25.3 ± 2.6 | 248 ± 0 | 11.5 ± 0.3 | 27.3 ± 1.9 | 50.1 ± 0.0 |
| idListTransposedOmit |  |  |  |  |  |  |  | 2.17 ± 0.08 | 25.1 ± 1.3 | 218 ± 0 | 9.92 ± 0.18 | 28.6 ± 1.3 | 40.2 ± 0.0 |
| idListBunchIndex |  |  |  |  |  |  |  | 2.33 ± 0.07 | 24.3 ± 1.5 | 211 ± 0 | 13.2 ± 0.3 | 27.5 ± 2.0 | 59.4 ± 0.0 |
| idListBunchIndexOmit |  |  |  |  |  |  |  | 2.26 ± 0.08 | 24.9 ± 2.1 | 181 ± 0 | 11.0 ± 0.3 | 28.7 ± 1.9 | 49.6 ± 0.0 |
| idListBunchDeltaOmit |  |  |  |  |  |  |  | 2.07 ± 0.06 | 13.1 ± 1.0 | 154 ± 0 | 9.56 ± 0.28 | 16.2 ± 1.4 | 38.8 ± 0.0 |
| idListTransposedProto |  |  |  |  |  |  |  | 1.27 ± 0.04 | 31.0 ± 6.9 | 196 ± 0 |  |  |  |
| idListTransposedOmitProto |  |  |  |  |  |  |  | 2.00 ± 0.06 | 27.9 ± 6.6 | 183 ± 0 |  |  |  |
| idListBunchIndexProto |  |  |  |  |  |  |  | 1.96 ± 0.07 | 15.3 ± 1.3 | 132 ± 0 |  |  |  |
| idListBunchIndexOmitProto |  |  |  |  |  |  |  | 1.89 ± 0.03 | 15.1 ± 1.1 | 119 ± 0 |  |  |  |
| idListSplitTransposed |  |  |  |  |  |  |  | 2.31 ± 0.09 | 23.1 ± 2.3 | 254 ± 0 | 12.3 ± 0.3 | 27.6 ± 2.8 | 41.7 ± 0.0 |
| idListSplitTransposedOmit |  |  |  |  |  |  |  | 2.86 ± 0.13 | 27.4 ± 1.9 | 223 ± 0 | 10.8 ± 0.2 | 30.2 ± 1.3 | 31.8 ± 0.0 |
| idListSplitClientIndex |  |  |  |  |  |  |  | 2.54 ± 0.17 | 25.0 ± 2.0 | 141 ± 0 | 11.6 ± 0.2 | 27.8 ± 2.8 | 40.1 ± 0.0 |
| idListSplitClientIndexOmit |  |  |  |  |  |  |  | 2.99 ± 0.23 | 26.4 ± 2.0 | 111 ± 0 | 10.4 ± 0.2 | 28.4 ± 2.1 | 30.3 ± 0.0 |
| idListSplitTransposedProto |  |  |  |  |  |  |  | 1.96 ± 0.04 | 27.0 ± 3.9 | 183 ± 0 |  |  |  |
| idListSplitTransposedOmitProto |  |  |  |  |  |  |  | 2.64 ± 0.06 | 27.7 ± 5.3 | 170 ± 0 |  |  |  |
| idListSplitClientIndexProto |  |  |  |  |  |  |  | 2.10 ± 0.05 | 21.2 ± 4.3 | 57.4 ± 0.0 |  |  |  |
| idListSplitClientIndexOmitProto |  |  |  |  |  |  |  | 2.68 ± 0.04 | 17.1 ± 1.1 | 44.5 ± 0.0 | 4.16 ± 0.09 | 27.9 ± 3.4 | 25.8 ± 0.0 |
| idListSplitClientDeltaOmitProto |  |  |  |  |  |  |  | 2.62 ± 0.14 | 15.9 ± 2.1 | 40.7 ± 0.0 | 4.14 ± 0.33 | 18.3 ± 0.7 | 25.7 ± 0.0 |
| automerge | 32.2 ± 0.3 | 30.3 ± 0.3 | 35.5 ± 0.3 | 41.4 ± 0.4 | 4105 ± 34 | 2.27 ± 0.56 |  | 17.4 ± 0.1 | 441 ± 6 | 156 ± 0 | 23.4 ± 0.3 | 443 ± 6 | 156 ± 0 |
| yjsText | 10.8 ± 0.1 | 10.1 ± 0.1 | 17.7 ± 0.1 | 29.0 ± 0.5 | 700 ± 20 | 563 ± 25 | 3043 ± 0 | 4.77 ± 0.08 | 29.9 ± 1.2 | 289 ± 0 | 12.7 ± 0.9 | 31.6 ± 1.0 | 117 ± 0 |

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
    List of IDs & Articulated &  \\
    CRDT & Yjs & $\num{3043} \pm 0$ \\
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
    & String w/ GZIP & $\num{28.3} \pm 0.0$ & $\num{2.82} \pm 0.06$ & $\num{2.83} \pm 0.16$ \\
    List of IDs & Articulated & $\num{876} \pm 0$ & $\num{2.48} \pm 0.18$ & $\num{27.6} \pm 2.2$ \\
    & Articulated w/ GZIP & $\num{71.9} \pm 0.0$ & $\num{19.2} \pm 2.0$ & $\num{33.1} \pm 1.7$ \\
    CRDT & Automerge & $\num{156} \pm 0$ & $\num{17.4} \pm 0.1$ & $\num{441} \pm 6$ \\
    & Yjs & $\num{289} \pm 0$ & $\num{4.77} \pm 0.08$ & $\num{29.9} \pm 1.2$ \\
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
    \multirow{3}{*}{\shortstack[l]{Traditional text-\\ editor data \\ structure}} & String & $[\num{629}k, \num{633}k]$ & $\num{2.20} \pm 0.02$ & $\num{2.54} \pm 0.01$ & $\num{422} \pm 82$ \\
    & Character Array & $[\num{282}k, \num{285}k]$ & $\num{8.85} \pm 0.04$ & $\num{10.9} \pm 0.1$ & $\num{1964} \pm 398$ \\
    & Rope & $[\num{211}k, \num{222}k]$ & $\num{1.87} \pm 0.04$ & $\num{51.4} \pm 1.5$ & $\num{3125} \pm 471$ \\
    & ProseMirror & $[\num{165}k, \num{166}k]$ & $\num{11.5} \pm 0.1$ & $\num{16.8} \pm 0.1$ & $\num{16510} \pm 1407$ \\
    List of IDs & Articulated &  &  &  &  \\
    CRDT & Automerge & $[\num{30.8}k, \num{31.4}k]$ & $\num{35.5} \pm 0.3$ & $\num{41.4} \pm 0.4$ & $\num{4105} \pm 34$ \\
    & Yjs & $[\num{91.8}k, \num{93.4}k]$ & $\num{17.7} \pm 0.1$ & $\num{29.0} \pm 0.5$ & $\num{700} \pm 20$ \\
  \bottomrule
\end{tabular}
\end{table}
```
