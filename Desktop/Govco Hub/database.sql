-- Govco Hub - MySQL Database Schema

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    quantity_available INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    is_admin TINYINT(1) DEFAULT 0,
    firebase_uid VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_firebase_uid (firebase_uid)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    house VARCHAR(100) NOT NULL,
    room VARCHAR(100) NOT NULL,
    notes TEXT,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_email (customer_email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36),
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id)
);

-- Past Questions Metadata Table (Optional - for tracking)
CREATE TABLE IF NOT EXISTS past_questions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    course_code VARCHAR(50) NOT NULL,
    level INT NOT NULL,
    semester INT NOT NULL,
    category VARCHAR(50),
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_question (course_code, level, semester, category),
    INDEX idx_course_code (course_code),
    INDEX idx_level (level)
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
);

-- Sessions Table (for session-based auth)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);
