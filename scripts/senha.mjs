/**
 * Gera o valor a colar na coluna Senha da aba Usuarios.
 * Uso: npm run senha "minhaSenhaForte"
 */
import { randomBytes, scryptSync } from 'node:crypto';

const senha = process.argv[2];

if (!senha) {
  console.error('Informe a senha: npm run senha "minhaSenhaForte"');
  process.exit(1);
}

const sal = randomBytes(16).toString('hex');
const chave = scryptSync(senha, sal, 32).toString('hex');

console.log(`scrypt$${sal}$${chave}`);
