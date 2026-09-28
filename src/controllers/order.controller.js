const prisma = require('../config/prisma');

// 1. Tạo đơn hàng và tự động chuyển sang shipment
exports.createOrder = async (req, res, next) => {
    try {
        const { items } = req.body; // Mảng: [{ pid: 1, qty: 2 }, { pid: 2, qty: 5 }]
        const uid = req.user.uid;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Danh sách sản phẩm không hợp lệ' });
        }

        const order = await prisma.$transaction(async (tx) => {
            // Tạo đơn hàng với thời gian hiện hành
            const newOrder = await tx.order.create({
                data: { uid },
            });

            // Duyệt từng sản phẩm, kiểm tra kho, tạo chi tiết và trừ kho
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { pid: Number(item.pid) },
                });

                if (!product) {
                    throw new Error(`Sản phẩm với ID ${item.pid} không tồn tại`);
                }

                if (product.quantity < Number(item.qty)) {
                    throw new Error(`Sản phẩm ${product.pname} không đủ số lượng trong kho`);
                }

                // Lưu OrderDetail
                await tx.orderDetail.create({
                    data: {
                        oid: newOrder.oid,
                        pid: Number(item.pid),
                        qty: Number(item.qty),
                        unit_price: product.price,
                    },
                });

                // Cập nhật trừ tồn kho
                await tx.product.update({
                    where: { pid: Number(item.pid) },
                    data: {
                        quantity: { decrement: Number(item.qty) },
                    },
                });
            }

            // Đặt hàng thành công -> Chuyển sang Shipment
            const newShipment = await tx.shipment.create({
                data: {
                    oid: newOrder.oid,
                    status: 'SHIPPED', // hoặc 'PROCESSING'
                },
            });

            return {
                oid: newOrder.oid,
                shipid: newShipment.shipid,
                message: 'Tạo đơn hàng và chuyển sang vận chuyển thành công'
            };
        });

        res.status(201).json({
            message: 'Đặt hàng thành công',
            data: order,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// 2. Xem thông tin đơn hàng và detail (theo oid)
exports.getOrderById = async (req, res, next) => {
    try {
        const oid = Number(req.params.id);

        const order = await prisma.order.findUnique({
            where: { oid },
            include: {
                details: {
                    include: {
                        product: {
                            select: { pname: true }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
        }

        res.status(200).json({
            message: 'Lấy thông tin đơn hàng thành công',
            data: order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Xem thông tin Shipment của đơn hàng
exports.getShipmentByOrderId = async (req, res, next) => {
    try {
        const oid = Number(req.params.id);

        const shipments = await prisma.shipment.findMany({
            where: { oid }
        });

        if (!shipments || shipments.length === 0) {
            return res.status(404).json({ error: 'Chưa có thông tin vận chuyển cho đơn hàng này' });
        }

        res.status(200).json({
            message: 'Lấy thông tin shipment thành công',
            data: shipments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};