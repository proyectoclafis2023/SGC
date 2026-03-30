CREATE DATABASE IF NOT EXISTS user_crud;
USE user_crud;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mock data
INSERT INTO users (name, email, role, status) VALUES 
('Admin User', 'admin@example.com', 'admin', 'active'),
('John Doe', 'john@example.com', 'user', 'active');
