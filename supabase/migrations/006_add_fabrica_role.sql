-- Migration: Add 'fabrica' role to users
-- Epic 4: Pedidos vs Produção

ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'gerente', 'operador', 'fabrica'));
