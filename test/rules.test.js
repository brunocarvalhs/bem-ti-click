// node test/rules.test.js — roda as mesmas checagens do ?teste, sem navegador.
import { selfCheck } from '../src/core/rules.js';

const result = selfCheck();
console.log('regras:', result);
if (!result.startsWith('ok')) process.exit(1);
