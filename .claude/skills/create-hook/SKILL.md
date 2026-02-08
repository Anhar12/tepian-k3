# Create Reusable Hook

1. Before writing any code, list ALL files that will be created or modified
2. Define the hook's public API (parameters, return type, generic constraints) and present for approval
3. For tRPC + TanStack Query interop: use explicit type parameters at call sites rather than deep generic inference
4. If a TypeScript type error persists after 2 fix attempts, stop and propose an alternative architecture
5. Include JSDoc documentation and a usage example
6. Run `npx tsc --noEmit` after implementation to verify
