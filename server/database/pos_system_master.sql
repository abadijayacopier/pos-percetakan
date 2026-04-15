-- Master Database Schema for AJ POS SaaS
-- Contains shop registries and subscription states

CREATE DATABASE IF NOT EXISTS `pos_system_master`;
USE `pos_system_master`;

-- 1. Shops Table
CREATE TABLE IF NOT EXISTS `shops` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `shop_name` VARCHAR(255) NOT NULL,
    `subdomain` VARCHAR(100) UNIQUE,
    `db_name` VARCHAR(100) UNIQUE NOT NULL,
    `owner_email` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'suspended', 'trial', 'expired') DEFAULT 'trial',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expiry_date` TIMESTAMP NULL,
    `subscription_plan` VARCHAR(50) DEFAULT 'basic'
);

-- 2. System Admins Table
CREATE TABLE IF NOT EXISTS `system_admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('superadmin', 'support') DEFAULT 'superadmin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Super Admin (superadmin / admin123)
-- Replace with hashed password in production
-- INSERT INTO `system_admins` (`username`, `password`, `role`) VALUES ('superadmin', '$2a$10$7R.xO1xI5D4Y2j0zXk5fYuXkZ...', 'superadmin');
