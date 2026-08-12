import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Regole di lint.
 *
 * Next 16 non porta più il comando `next lint`: la configurazione sta qui e
 * `npm run lint` chiama direttamente eslint. Il preset di Next copre quello
 * che il compilatore TypeScript non vede — hook di React usati fuori posto,
 * `<img>` al posto di `next/image`, import che rompono la build.
 */

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**", // client Prisma, generato
      "public/**",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
