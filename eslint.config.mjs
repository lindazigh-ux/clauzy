import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const configuration = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**'] },
  ...coreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      /**
       * La couche src/lib/net est la seule surface reseau du produit (brief §2).
       * Le test tests/architecture/aucun-fetch-hors-net.test.ts le verifie aussi ;
       * cette regle donne le retour immediat dans l editeur.
       */
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Passez par appelApi() dans src/lib/net (brief §2).' },
        { name: 'XMLHttpRequest', message: 'Passez par appelApi() dans src/lib/net (brief §2).' },
        { name: 'WebSocket', message: 'Passez par appelApi() dans src/lib/net (brief §2).' },
        { name: 'EventSource', message: 'Passez par appelApi() dans src/lib/net (brief §2).' },
      ],
    },
  },
  {
    files: ['src/lib/net/**'],
    rules: { 'no-restricted-globals': 'off' },
  },
]

export default configuration
