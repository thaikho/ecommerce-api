const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Mọi người đều có thể xem danh sách sản phẩm
router.get('/', productController.getAll);

// Chỉ Admin mới được phép tạo sản phẩm mới
router.post('/', authenticate, authorize('ADMIN'), productController.create);

module.exports = router;