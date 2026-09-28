const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res, next) => {
    try {
        const { username, password, fullname } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username và password là bắt buộc' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Tìm role 'normal' (không phân biệt chữ hoa thường) hoặc lấy role đầu tiên
        let normalRole = await prisma.role.findFirst({
            where: {
                rolename: {
                    equals: 'normal',
                    mode: 'insensitive'
                }
            }
        });

        // Nếu chưa hề có role nào, mới tạo mới
        if (!normalRole) {
            normalRole = await prisma.role.create({
                data: { rolename: 'normal' }
            });
        }

        // 2. Tìm membership có score = 10 hoặc lấy bản ghi membership đầu tiên
        let membership = await prisma.membership.findFirst({
            where: { score: 10 }
        });

        if (!membership) {
            membership = await prisma.membership.findFirst();
        }

        // Nếu bảng membership hoàn toàn rỗng, mới tạo mới
        if (!membership) {
            membership = await prisma.membership.create({
                data: {
                    mname: 'Standard',
                    score: 10
                }
            });
        }

        // 3. Tạo tài khoản người dùng gắn roleid và mid
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                fullname: fullname || username,
                roleid: normalRole.roleid,
                mid: membership.mid
            },
            select: {
                uid: true,
                username: true,
                fullname: true,
                role: {
                    select: { rolename: true }
                },
                member: {
                    select: { mname: true, score: true }
                },
                createdAt: true
            }
        });

        return res.status(201).json({
            message: 'Đăng ký thành công',
            data: newUser
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { username },
            include: { role: true, member: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        const token = jwt.sign(
            {
                uid: user.uid,
                username: user.username,
                role: user.role ? user.role.rolename : 'normal'
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                uid: user.uid,
                username: user.username,
                fullname: user.fullname,
                role: user.role ? user.role.rolename : 'normal',
                score: user.member ? user.member.score : 0
            }
        });
    } catch (error) {
        next(error);
    }
};