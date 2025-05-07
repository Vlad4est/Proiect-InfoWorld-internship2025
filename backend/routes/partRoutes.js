const express = require('express');
const partController = require('../controllers/partController');

const router = express.Router();

/**
 * @route GET /api/parts
 * @desc Obține toate piesele
 * @access Public
 */
router.get('/', partController.getAllParts);

/**
 * @route GET /api/parts/categories
 * @desc Obține toate categoriile de piese
 * @access Public
 */
router.get('/categories', partController.getCategories);

/**
 * @route GET /api/parts/:id
 * @desc Obține o piesă după ID
 * @access Public
 */
router.get('/:id', partController.getPartById);

/**
 * @route POST /api/parts
 * @desc Creează o piesă nouă
 * @access Public
 */
router.post('/', partController.createPart);

/**
 * @route PUT /api/parts/:id
 * @desc Actualizează o piesă
 * @access Public
 */
router.put('/:id', partController.updatePart);

/**
 * @route PATCH /api/parts/:id/active
 * @desc Activează sau dezactivează o piesă
 * @access Public
 */
router.patch('/:id/active', partController.togglePartActive);

/**
 * @route PATCH /api/parts/:id/stock
 * @desc Actualizează stocul unei piese
 * @access Public
 */
router.patch('/:id/stock', partController.updateStock);

/**
 * @route DELETE /api/parts/:id
 * @desc Șterge o piesă
 * @access Public
 */
router.delete('/:id', partController.deletePart);

module.exports = router;