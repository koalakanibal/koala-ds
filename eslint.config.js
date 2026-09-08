import js from '@eslint/js'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'

export default defineConfigWithVueTs(
    { ignores: ['**/dist/**', '**/.turbo/**', '**/coverage/**'] },
    { files: ['**/*.{js,mjs,ts,vue}'] },
    js.configs.recommended,
    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    {
        files: ['scripts/**/*.mjs'],
        languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
    },
    prettier,
)