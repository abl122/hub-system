// Execute este comando no MongoDB Compass ou mongo shell
// Database: mkedge
// Collection: usuarios

// Comando para inserir usuário do portal
db.usuarios.insertOne({
  "username": "04.038.227/0001-87",
  "senha": "$2b$10$hOgcef30Ptd7jF9BIptyYeoL9i2RkQnWoOvAlh4zglq4LpMask5mW",
  "email": "admin@mk-edge.com.br",
  "role": "portal",
  "tenant_id": "63dd998b885eb427c8c51958",
  "ativo": true,
  "criado_em": new Date(),
  "atualizado_em": new Date()
})

// Após inserir, execute este comando para verificar:
// db.usuarios.find({ username: "04.038.227/0001-87" })
