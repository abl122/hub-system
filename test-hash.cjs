const bcrypt = require('bcrypt');

const hash = '$2a$10$9248VFZnB.ctiROXITRJz..U97J/KiWvuUQ8UJX7JnMo4vvZB3wrC';
const senhas = ['F@lcon31', 'F@lcon2931', 'admin', '123456', 'senha123', 'senha_tenant'];

console.log('Testando senhas contra o hash BCrypt:\n');
console.log('Hash:', hash);
console.log('\n--- Resultados ---\n');

senhas.forEach(senha => {
  try {
    const match = bcrypt.compareSync(senha, hash);
    console.log(`Senha '${senha}': ${match ? '✅ MATCH!' : '❌ nao funciona'}`);
  } catch(e) {
    console.log(`Senha '${senha}': Erro`);
  }
});
