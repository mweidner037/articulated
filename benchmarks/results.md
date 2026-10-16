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
| idList | 1.71 ± 0.01 | 1.62 ± 0.01 | 1.98 ± 0.03 | 3.66 ± 0.07 | 481 ± 50 | 17723 ± 356 | 2528 ± 0 | 3.26 ± 0.12 | 14.2 ± 1.1 | 871 ± 0 | 19.9 ± 1.4 | 17.7 ± 1.8 | 65.3 ± 0.0 |
| automerge | 27.8 ± 0.1 | 27.4 ± 0.1 | 32.0 ± 0.2 | 37.0 ± 0.2 | 4189 ± 68 | 3.08 ± 0.91 |  | 17.2 ± 0.1 | 348 ± 1 | 129 ± 0 | 19.7 ± 0.1 | 346 ± 3 | 129 ± 0 |
| yjsText | 11.3 ± 0.1 | 11.8 ± 0.2 | 13.7 ± 0.1 | 26.4 ± 0.8 | 650 ± 57 | 560 ± 67 | 2977 ± 1 | 5.02 ± 0.11 | 26.2 ± 2.7 | 309 ± 5 | 14.9 ± 0.2 | 28.6 ± 1.3 | 107 ± 0 |

### Refresh every 1000 ops

| Algorithm | Mean (μs) | P50 (μs) | P90 (μs) | P99 (μs) | P100 (μs) | Iteration time (μs) | Memory (kB) | Save time (ms) | Load time (ms) | Save size (kB) | Save time GZIP (ms) | Load time GZIP (ms) | Save size GZIP (kB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| string | 1.59 ± 0.01 | 1.59 ± 0.01 | 2.20 ± 0.02 | 2.54 ± 0.01 | 422 ± 82 | 3.09 ± 0.63 | 105 ± 0 | 0.00267 ± 0.00087 | 0.00878 ± 0.00487 | 105 ± 0 | 2.82 ± 0.06 | 2.83 ± 0.16 | 28.3 ± 0.0 |
| charArray | 3.52 ± 0.02 | 1.83 ± 0.02 | 8.85 ± 0.04 | 10.9 ± 0.1 | 1964 ± 398 | 687 ± 25 | 839 ± 0 | 1.58 ± 0.05 | 2.10 ± 0.12 | 105 ± 0 | 4.32 ± 0.05 | 3.94 ± 0.53 | 28.3 ± 0.0 |
| rope | 4.62 ± 0.12 | 0.162 ± 0.009 | 1.87 ± 0.04 | 51.4 ± 1.5 | 3125 ± 471 | 490 ± 24 | 839 ± 0 | 2.32 ± 0.07 | 1.86 ± 0.37 | 105 ± 0 | 8.70 ± 0.13 | 4.16 ± 0.39 | 28.3 ± 0.0 |
| proseMirror | 6.04 ± 0.03 | 3.22 ± 0.02 | 11.5 ± 0.1 | 16.8 ± 0.1 | 16510 ± 1407 | 37.9 ± 3.4 | 382 ± 7 | 0.429 ± 0.076 | 3.20 ± 0.57 | 166 ± 0 | 8.66 ± 0.79 | 4.94 ± 1.14 | 30.6 ± 0.0 |
| idList | 1.45 ± 0.01 | 1.34 ± 0.01 | 1.58 ± 0.00 | 3.84 ± 0.04 | 543 ± 24 | 16953 ± 933 | 2613 ± 2 | 2.32 ± 0.09 | 17.4 ± 2.1 | 876 ± 0 | 20.9 ± 1.6 | 21.2 ± 1.1 | 71.9 ± 0.0 |
| idListSigned |  |  |  |  |  |  |  | 2.17 ± 0.10 | 16.7 ± 1.4 | 671 ± 0 | 15.6 ± 0.4 | 20.2 ± 1.3 | 67.2 ± 0.0 |
| idListTransposed |  |  |  |  |  |  |  | 1.52 ± 0.06 | 16.6 ± 1.6 | 248 ± 0 | 11.7 ± 0.2 | 16.2 ± 2.2 | 50.1 ± 0.0 |
| idListBunchIndex |  |  |  |  |  |  |  | 2.13 ± 0.04 | 16.1 ± 1.6 | 211 ± 0 | 13.2 ± 0.2 | 18.0 ± 1.5 | 59.4 ± 0.0 |
| idListSplit |  |  |  |  |  |  |  | 3.21 ± 0.27 | 17.9 ± 0.9 | 1002 ± 0 | 22.9 ± 1.5 | 22.5 ± 1.9 | 73.5 ± 0.0 |
| idListSplitSigned |  |  |  |  |  |  |  | 3.01 ± 0.11 | 17.0 ± 0.7 | 798 ± 0 | 21.4 ± 1.3 | 19.9 ± 0.8 | 69.9 ± 0.0 |
| idListSplitTransposed |  |  |  |  |  |  |  | 2.15 ± 0.12 | 16.1 ± 1.7 | 254 ± 0 | 11.0 ± 1.2 | 17.7 ± 1.4 | 41.7 ± 0.0 |
| idListSplitClientIndex |  |  |  |  |  |  |  | 2.38 ± 0.06 | 14.8 ± 1.0 | 141 ± 0 | 11.7 ± 0.5 | 16.3 ± 1.6 | 40.1 ± 0.0 |
| idListBunchIndexProto |  |  |  |  |  |  |  | 2.04 ± 0.07 | 15.0 ± 2.1 | 132 ± 0 | 6.62 ± 0.07 | 17.2 ± 1.7 | 54.3 ± 0.0 |
| idListSplitClientIndexProto |  |  |  |  |  |  |  | 2.13 ± 0.02 | 18.0 ± 3.2 | 57.4 ± 0.0 | 4.21 ± 0.35 | 17.3 ± 2.8 | 34.4 ± 0.0 |
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
    List of IDs & Articulated & $\num{2613} \pm 2$ \\
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
    List of IDs & Articulated & $\num{876} \pm 0$ & $\num{2.32} \pm 0.09$ & $\num{17.4} \pm 2.1$ \\
    & Articulated w/ GZIP & $\num{71.9} \pm 0.0$ & $\num{20.9} \pm 1.6$ & $\num{21.2} \pm 1.1$ \\
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
    List of IDs & Articulated & $[\num{683}k, \num{693}k]$ & $\num{1.58} \pm 0.00$ & $\num{3.84} \pm 0.04$ & $\num{543} \pm 24$ \\
    CRDT & Automerge & $[\num{30.8}k, \num{31.4}k]$ & $\num{35.5} \pm 0.3$ & $\num{41.4} \pm 0.4$ & $\num{4105} \pm 34$ \\
    & Yjs & $[\num{91.8}k, \num{93.4}k]$ & $\num{17.7} \pm 0.1$ & $\num{29.0} \pm 0.5$ & $\num{700} \pm 20$ \\
  \bottomrule
\end{tabular}
\end{table}
```
