const router = require('express').Router();
const orderController = require('../controllers/order.controller');

// Đặt hàng
router.post('/', orderController.createOrder);

// Xem thông tin đơn hàng và chi tiết (detail)
router.get('/:id', orderController.getOrderById);

// Xem thông tin shipment của đơn hàng
router.get('/:id/shipment', orderController.getShipmentByOrderId);

module.exports = router;