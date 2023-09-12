const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController/userController')
/* GET users listing. */
router.get('/', userController.home);

module.exports = router;
