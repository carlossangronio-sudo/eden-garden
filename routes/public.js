const express = require('express');
const router = express.Router();
const { RestaurantInfo, MenuItem } = require('../models');

// Public homepage
router.get('/', async (req, res) => {
    try {
        const restaurant = await RestaurantInfo.findOne();
        const menuItems = await MenuItem.findAll({
            where: { isVisible: true },
            order: [['position', 'ASC']]
        });

        res.render('index', {
            restaurant: restaurant || {},
            menuItems: menuItems || []
        });
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Menu page with all language options
router.get('/menu', async (req, res) => {
    try {
        const restaurant = await RestaurantInfo.findOne();
        res.render('menu', { restaurant: restaurant || {} });
    } catch (error) {
        console.error('Error loading menu page:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Mentions légales
router.get('/mentions-legales', async (req, res) => {
    try {
        const restaurant = await RestaurantInfo.findOne();
        res.render('legal/mentions', { restaurant: restaurant || {} });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Politique de confidentialité
router.get('/confidentialite', async (req, res) => {
    try {
        const restaurant = await RestaurantInfo.findOne();
        res.render('legal/privacy', { restaurant: restaurant || {} });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
