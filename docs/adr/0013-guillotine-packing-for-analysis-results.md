# 0013. Guillotine Packing for City Layout

- **Status:** Accepted
- **Date:** 2026-11-22
- **Category:** Feature: Analysis Results

## Context

The city layout places square buildings (files) and rectangular platforms (folders) on a parent platform, recursively from the leaves up. Children must not overlap and must keep a fixed margin between each other and the platform edge. The main goal is to minimize unused platform area; keeping platforms close to square is secondary.

## Decision

I chose a simple greedy heuristic made of three parts:

1. **Guillotine packing based on potpack.** Children are sorted by width (descending) and each one goes into the top-left corner of the smallest free space that fits it; the remaining space is split in two. The margin is added to every rectangle's size before packing, so the packer itself knows nothing about margins.
2. **A short width sweep.** The packer runs for eight container widths (0.7–1.4 × the ideal square side) and keeps the cheapest result. Area dominates the cost function and elongated platforms are penalized slightly.
3. **Greedy folder rotation.** For every non-square child folder, from the largest, the parent tries the variant rotated by 90° (with its whole subtree) and keeps it if the cost drops.

## Alternatives Considered

- **Skyline packer with a genetic algorithm (previous solution)** – gave slightly worse results at a much higher cost in code and running time, and its parameters (population, mutation, stagnation) had no clear link to the layout quality.
- **potpack library as is** – tiny and aims for a near-square container, but it does not allow setting the container width. On a single level it wastes about 15% of the area, and in nested folders these losses multiply: platforms were about 50% larger than before. I therefore kept its algorithm but embedded it with a configurable width.
- **MaxRects** – usually packs better than skyline and guillotine because it tracks overlapping free rectangles, but it is more complex. The simpler packer with a width sweep already beats the previous solution, so the extra complexity was not justified.
- **Shelf packing (FFDH/NFDH)** – very simple, but it wastes space when large and small buildings are mixed, which is typical for repositories.
- **Exact solvers (CP-SAT, MILP)** – give optimal layouts, but packing is NP-hard and they would have to be run for every folder. They are excessive for a visualization.
- **Squarified treemap** – gives nicely proportioned areas but does not respect the real building sizes, so the result would have to be repaired anyway. At most it could serve as an initial placement.

## Consequences

- **Positive:** less unused platform area than the previous solution, with simple code and a short running time.
- **Negative:** the layout is a heuristic, not an optimum. Rotation is greedy and works on one level at a time; child folders are packed before their parent, so they cannot adapt their shape to the parent.
- **Follow-ups:** the aspect ratio weight (0.2) and the list of widths are tuning parameters; a higher weight gives more square platforms at the cost of area. If the waste becomes visible, the next step is to let each folder offer a few shape variants to its parent, not to bring back a genetic algorithm.