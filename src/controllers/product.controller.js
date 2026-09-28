const prisma = require('../config/prisma');

exports.getAll = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json({ data: products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res, next) => {
    try {
        const { pname, price, quantity } = req.body;
        const product = await prisma.product.create({
            data: {
                pname,
                price,
                quantity: parseInt(quantity, 10),
            },
        });
        res.status(201).json({
            message: 'Tạo sản phẩm thành công',
            data: product,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};