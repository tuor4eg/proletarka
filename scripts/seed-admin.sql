-- Запустить один раз для создания первого администратора.
-- Подставить реальный bcrypt-хэш пароля (генерировать: npx bcryptjs <пароль>).
INSERT INTO users (email, name, password, role)
VALUES ('admin@example.com', 'Admin', '$2b$12$Q9.VzWyy34Bv8ep2xEIXhu2e3Uxa4QxEYa8ET8bV0eD68MQON9DbK', 'admin');
