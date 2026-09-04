import js from '@eslint/js'

export default [
  { ignores: ['**/dist/**', '**/.turbo/**', '**/coverage/**'] },
  js.configs.recommended,
]
