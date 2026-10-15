export default [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: Object.fromEntries([
    'document','window','localStorage','matchMedia','requestAnimationFrame','setTimeout','clearTimeout',
    'innerWidth','innerHeight','HTMLElement','Element','console','URLSearchParams','location','history','getComputedStyle',
  ].map(name => [name, 'readonly'])) },
  rules: { 'no-unused-vars': 'error', 'no-undef': 'error', 'no-var': 'error', 'prefer-const': 'error', 'eqeqeq': 'error' },
}];
