const express = require('express');
const carController = require('../controllers/carController');

const router = express.Router();

/**
 * @route GET /api/cars
 * @desc Obține toate mașinile
 * @access Public
 */
router.get('/', carController.getAllCars);

/**
 * @route GET /api/cars/:id
 * @desc Obține o mașină după ID
 * @access Public
 */
router.get('/:id', carController.getCarById);

/**
 * @route POST /api/cars
 * @desc Creează o mașină nouă
 * @access Public
 */
router.post('/', carController.createCar);

/**
 * @route PUT /api/cars/:id
 * @desc Actualizează o mașină
 * @access Public
 */
router.put('/:id', carController.updateCar);

/**
 * @route PATCH /api/cars/:id/active
 * @desc Activează sau dezactivează o mașină
 * @access Public
 */
router.patch('/:id/active', carController.toggleCarActive);

/**
 * @route DELETE /api/cars/:id
 * @desc Șterge o mașină
 * @access Public
 */
router.delete('/:id', carController.deleteCar);

module.exports = router;