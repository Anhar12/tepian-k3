/**
 * Module boundary rules for tepian-k3's modular monolith architecture.
 *
 * Enforces the following dependency direction:
 *
 *   platform  (no domain imports allowed)
 *      ^
 *   pengujian | pelatihan | uji-kompetensi | konsultasi
 *   (can import from platform only, not from each other)
 *
 * These rules use ESLint's built-in `no-restricted-imports` with glob
 * patterns matched against the raw import specifier string.
 *
 * Usage in per-package eslint.config.js:
 *   import boundaries from "@tepian-k3/config/eslint/boundaries.js";
 *   export default [...base, ...boundaries];
 */

const PLATFORM_MSG =
  "Platform layer cannot import from domain modules. Cross-domain data must flow through platform exports only.";

const DOMAIN_MSG =
  "Domain modules cannot import from each other. Use platform exports only for cross-domain data.";

/**
 * Builds a no-restricted-imports pattern entry for a domain directory.
 * Matches both exact imports ("../pengujian") and deep imports ("../pengujian/thing").
 */
function restrictDomain(domain, message) {
  return {
    group: [`**/${domain}`, `**/${domain}/**`],
    message,
  };
}

export default [
  // ── Platform ──────────────────────────────────────────────────────────────
  // Cannot import from any domain module.
  {
    files: [
      "src/platform/**/*.{ts,tsx}",
      "src/routers/platform/**/*.{ts,tsx}",
      "src/schema/platform.ts",
      "src/platform/*.types.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            restrictDomain("pengujian", PLATFORM_MSG),
            restrictDomain("pelatihan", PLATFORM_MSG),
            restrictDomain("uji-kompetensi", PLATFORM_MSG),
            restrictDomain("konsultasi", PLATFORM_MSG),
          ],
        },
      ],
    },
  },

  // ── Pengujian ──────────────────────────────────────────────────────────────
  // Can import from platform. Cannot import from peer domains.
  {
    files: [
      "src/pengujian/**/*.{ts,tsx}",
      "src/routers/pengujian/**/*.{ts,tsx}",
      "src/schema/pengujian.ts",
      "src/pengujian/*.types.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            restrictDomain("pelatihan", DOMAIN_MSG),
            restrictDomain("uji-kompetensi", DOMAIN_MSG),
            restrictDomain("konsultasi", DOMAIN_MSG),
          ],
        },
      ],
    },
  },

  // ── Pelatihan ──────────────────────────────────────────────────────────────
  // Can import from platform. Cannot import from peer domains.
  {
    files: [
      "src/pelatihan/**/*.{ts,tsx}",
      "src/routers/pelatihan/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            restrictDomain("pengujian", DOMAIN_MSG),
            restrictDomain("uji-kompetensi", DOMAIN_MSG),
            restrictDomain("konsultasi", DOMAIN_MSG),
          ],
        },
      ],
    },
  },

  // ── Uji-kompetensi ────────────────────────────────────────────────────────
  // Can import from platform. Cannot import from peer domains.
  {
    files: [
      "src/uji-kompetensi/**/*.{ts,tsx}",
      "src/routers/uji-kompetensi/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            restrictDomain("pengujian", DOMAIN_MSG),
            restrictDomain("pelatihan", DOMAIN_MSG),
            restrictDomain("konsultasi", DOMAIN_MSG),
          ],
        },
      ],
    },
  },

  // ── Konsultasi ────────────────────────────────────────────────────────────
  // Can import from platform. Cannot import from peer domains.
  {
    files: [
      "src/konsultasi/**/*.{ts,tsx}",
      "src/routers/konsultasi/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            restrictDomain("pengujian", DOMAIN_MSG),
            restrictDomain("pelatihan", DOMAIN_MSG),
            restrictDomain("uji-kompetensi", DOMAIN_MSG),
          ],
        },
      ],
    },
  },
];
