import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * Lint policy.
 *
 * The previous setup ran every rule at its default severity while the CI step carried
 * `continue-on-error: true`. The result was 353 problems and a lint step nobody looked at,
 * which is the same as having none. CI now blocks, so the severities below are a deliberate
 * statement about what should stop a merge.
 *
 * Two rules are downgraded on evidence rather than for convenience:
 *
 *   react-hooks/set-state-in-effect and react-hooks/immutability fire on ~48 sites, almost
 *   all of the shape `useEffect(() => { fetchThing() }, [])` where `fetchThing` is declared
 *   with const further down the component. Each was checked: the effect callback runs after
 *   the component body has finished, so the binding is initialised by the time it is read.
 *   Real code smells worth cleaning up, not runtime faults — and blocking every merge on them
 *   would only teach people to reach for eslint-disable.
 *
 *   no-explicit-any covers 55 pre-existing sites. Tracked debt: new code should be typed and
 *   the count should only go down. The --max-warnings ceiling in package.json is the ratchet.
 */
export default [
  ...nextVitals,
  ...nextTypescript,

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist-electron/**',
      'android/**',
      'public/**',
    ],
  },

  {
    // The react-hooks and react plugins come from the Next configs above; reusing their
    // plugin registration is why this object declares no plugins key of its own.
    plugins: nextVitals.find(c => c.plugins?.['react-hooks'])?.plugins,
    rules: {
      // Tracked debt. Should trend to zero; must not grow.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Verified as lint-level rather than runtime faults — see the note above.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',

      // An apostrophe in a sentence is not a defect.
      'react/no-unescaped-entities': 'warn',

      // Worth doing for image performance; not worth blocking a safety fix on.
      '@next/next/no-img-element': 'warn',
    },
  },

  {
    // The Electron main process and the image-download utilities are CommonJS by necessity.
    files: ['electron/**/*.js', 'scripts/**/*.cjs', 'scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  {
    // Tests assert on deliberately loose shapes, and unused bindings in fixtures are dull.
    files: ['tests/**/*.ts', 'scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
]
