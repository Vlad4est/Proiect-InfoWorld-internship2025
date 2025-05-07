const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Înregistrează un client nou
 * @access Public
 */
router.post('/register', authController.registerClient);

/**
 * @route POST /api/auth/login
 * @desc Autentifică un utilizator (client sau admin)
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/profile
 * @desc Obține profilul utilizatorului autentificat
 * @access Private
 */
router.get('/profile', authMiddleware.authenticate, authController.getProfile);

/**
 * @route PUT /api/auth/password
 * @desc Actualizează parola utilizatorului autentificat
 * @access Private
 */
router.put('/password', authMiddleware.authenticate, authController.updatePassword);

/**
 * @route POST /api/auth/admin
 * @desc Creează un admin nou
 * @access Private - doar admin
 */
router.post('/admin', 
  authMiddleware.authenticate, 
  //authMiddleware.authorize('admin'), 
  authController.createAdmin
);

/**
 * @route GET /api/auth/admins
 * @desc Obține lista de administratori
 * @access Private - doar admin
 */
router.get('/admins', 
  authMiddleware.authenticate, 
  authMiddleware.authorize('admin'), 
  authController.getAdmins
);

/**
 * @route PATCH /api/auth/admins/:id/active
 * @desc Activează sau dezactivează un admin
 * @access Private - doar admin
 */
router.patch('/admins/:id/active', 
  authMiddleware.authenticate, 
  authMiddleware.authorize('admin'), 
  authController.toggleAdminActive
);

module.exports = router;