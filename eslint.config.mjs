import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vueParser from "vue-eslint-parser"
import withNuxt from './.nuxt/eslint.config.mjs'



export default withNuxt(
    // 1. Basis: ESLint recommended
    eslint.configs.recommended,

    // 2. TypeScript recommended (ohne Typ-Checking für Performance)
    ...tseslint.configs.recommended,

    // 3. Vue recommended (EINZELN spreaden, nicht als Komma-Operator!)
    ...pluginVue.configs['flat/recommended'],

    // 4. Globale Ignores
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.nuxt/**',
            '**/.output/**',
            '**/coverage/**',
        ],
    },

    // 5. Vue + TypeScript Dateien
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module',
                extraFileExtensions: ['.vue'],
            },
        },
    },

    // 6. TypeScript Dateien
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            sourceType: 'module',
        },
    },
    {
        files: ['server/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Console ist OK im Server
            'no-console': 'off',

            'no-duplicate-imports': 'off',
        },
    },

    {
        files: ['**/*.{ts,vue}'],
        rules: {
            // ── Vue ──────────────────────────────────────
            // Multi-word Komponentennamen (Index.vue, etc.) erlauben
            'vue/multi-word-component-names': 'off',
            'no-duplicate-imports': 'off', // Vue SFCs können nicht doppelt importiert werden

            // Props Destructuring erlauben (Vue 3.5+ Reactivity Transform)
            'vue/no-setup-props-destructure': 'off',

            // v-html erlauben (bewusst nutzen)
            'vue/no-v-html': 'warn',

            // Konsistente Macro-Reihenfolge in <script setup>
            'vue/define-macros-order': ['error', {
                order: ['defineProps', 'defineEmits', 'defineModel', 'defineSlots'],
            }],

            // Self-closing für Komponenten ohne Content
            'vue/html-self-closing': ['warn', {
                html: { void: 'always', normal: 'never', component: 'always' },
            }],

            // Max Attribute pro Zeile
            'vue/max-attributes-per-line': ['warn', {
                singleline: { max: 3 },
                multiline: { max: 1 },
            }],

            // ── TypeScript ───────────────────────────────
            // any ist manchmal nötig (z.B. bei Third-Party Libs)
            '@typescript-eslint/no-explicit-any': 'warn',

            // Unused vars mit _ Prefix erlauben
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],

            // Leere Funktionen erlauben (Event Handler Stubs)
            '@typescript-eslint/no-empty-function': 'off',

            // Non-null Assertion (!) erlauben — bewusst nutzen
            '@typescript-eslint/no-non-null-assertion': 'off',

            // require() verbieten — ESM nutzen
            '@typescript-eslint/no-require-imports': 'error',

            // ── General ──────────────────────────────────
            // console.warn/error erlauben, console.log warnen
            'no-console': ['warn', {
                allow: ['warn', 'error', 'info'],
            }],

            // Kein debugger in Production
            'no-debugger': 'warn',

            // Prefer const
            'prefer-const': 'warn',

            // Keine var
            'no-var': 'error',

            // === statt ==
            'eqeqeq': ['error', 'smart'],

            // Kein unused expressions (aber Short-Circuit erlauben)
            'no-unused-expressions': ['warn', {
                allowShortCircuit: true,
                allowTernary: true,
            }],
        },
    },

    // 8. Server-spezifische Regeln
    {
        files: ['server/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Console ist OK im Server
            'no-console': 'off',
        },
    },
)