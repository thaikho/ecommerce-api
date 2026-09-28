const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Đăng ký tài khoản mới
 */
async function register({ username, password, fullname, roleid, mid }) {
    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        const error = new Error('Username already exists');
        error.statusCode = 409;
        throw error;
    }

    // Băm mật khẩu bằng bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu thông tin vào database
    const user = await prisma.user.create({
        data: {
            username,
            fullname,
            password: hashedPassword,
            roleid,
            mid,
        },
        select: {
            uid: true,
            username: true,
            fullname: true,
            roleid: true,
            mid: true,
        },
    });

    return user;
}

/**
 * Đăng nhập tài khoản & cấp token
 */
async function login(username, password) {
    // Tìm người dùng kèm thông tin Role
    const user = await prisma.user.findUnique({
        where: { username },
        include: { role: true },
    });

    if (!user) {
        const error = new Error('Invalid username or password');
        error.statusCode = 401;
        throw error;
    }

    // So sánh hash mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        const error = new Error('Invalid username or password');
        error.statusCode = 401;
        throw error;
    }

    // Tạo JWT Access Token
    const token = jwt.sign(
        {
            uid: user.uid,
            username: user.username,
            rolename: user.role.rolename,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        }
    );

    return {
        token,
        user: {
            uid: user.uid,
            username: user.username,
            fullname: user.fullname,
            rolename: user.role.rolename,
        },
    };
}

module.exports = {
    register,
    login,
};