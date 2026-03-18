-- Admin user: admin@festeja.com / admin123
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (email, name, password_hash, role) VALUES
  ('admin@festeja.com', 'Administrador', '$2a$10$8KzaNdKwZ5VQhKmU6VBqUe6/0gV3g5VBhKPe4GjKVLqHzqjKzKzKa', 'admin');
