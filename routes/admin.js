const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { RestaurantInfo, MenuItem, AdminUser, GalleryImage } = require('../models');
const { requireAuth } = require('../middleware/auth');

// Rate limiter pour le login (5 tentatives par 15 min)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.render('admin/login', {
            error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
        });
    }
});

// Validation helpers
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePrice = (price) => {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0 && num <= 9999.99;
};

const sanitizeString = (str, maxLength = 500) => {
    if (!str) return '';
    return String(str).trim().slice(0, maxLength);
};

const sanitizeUrl = (url) => {
    if (!url) return '';
    url = String(url).trim();
    // Autoriser uniquement http, https, et liens relatifs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url.slice(0, 2000);
    }
    return '';
};

// Login page
router.get('/login', (req, res) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

// Login handler (avec rate limiting)
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const email = sanitizeString(req.body.email, 100).toLowerCase();
        const password = req.body.password || '';

        if (!validateEmail(email)) {
            return res.render('admin/login', { error: 'Email invalide' });
        }

        const admin = await AdminUser.findOne({ where: { email } });

        if (!admin) {
            return res.render('admin/login', { error: 'Email ou mot de passe incorrect' });
        }

        const validPassword = await bcrypt.compare(password, admin.passwordHash);
        if (!validPassword) {
            return res.render('admin/login', { error: 'Email ou mot de passe incorrect' });
        }

        // Régénérer la session après login (sécurité)
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regenerate error:', err);
                return res.render('admin/login', { error: 'Erreur de connexion' });
            }
            req.session.adminId = admin.id;
            req.session.adminEmail = admin.email;
            res.redirect('/admin');
        });
    } catch (error) {
        console.error('Login error:', error);
        res.render('admin/login', { error: 'Erreur de connexion' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/admin/login');
    });
});

// Dashboard
router.get('/', requireAuth, async (req, res) => {
    try {
        const menuCount = await MenuItem.count();
        const restaurant = await RestaurantInfo.findOne();
        res.render('admin/dashboard', {
            adminEmail: req.session.adminEmail,
            menuCount,
            restaurantName: restaurant?.name || 'Eden Garden'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('admin/dashboard', {
            adminEmail: req.session.adminEmail,
            menuCount: 0,
            restaurantName: 'Eden Garden'
        });
    }
});

// ========== CHANGEMENT DE MOT DE PASSE ==========

router.get('/password', requireAuth, (req, res) => {
    res.render('admin/password', {
        adminEmail: req.session.adminEmail,
        error: null,
        success: req.query.success === '1'
    });
});

router.post('/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('admin/password', {
                adminEmail: req.session.adminEmail,
                error: 'Tous les champs sont requis',
                success: false
            });
        }

        if (newPassword.length < 8) {
            return res.render('admin/password', {
                adminEmail: req.session.adminEmail,
                error: 'Le nouveau mot de passe doit faire au moins 8 caractères',
                success: false
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('admin/password', {
                adminEmail: req.session.adminEmail,
                error: 'Les mots de passe ne correspondent pas',
                success: false
            });
        }

        const admin = await AdminUser.findByPk(req.session.adminId);
        if (!admin) {
            return res.redirect('/admin/logout');
        }

        const validPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!validPassword) {
            return res.render('admin/password', {
                adminEmail: req.session.adminEmail,
                error: 'Mot de passe actuel incorrect',
                success: false
            });
        }

        // Mettre à jour le mot de passe
        const newHash = await bcrypt.hash(newPassword, 10);
        await admin.update({ passwordHash: newHash });

        res.redirect('/admin/password?success=1');
    } catch (error) {
        console.error('Password change error:', error);
        res.render('admin/password', {
            adminEmail: req.session.adminEmail,
            error: 'Erreur lors du changement de mot de passe',
            success: false
        });
    }
});

// ========== RESTAURANT INFO ==========

router.get('/restaurant', requireAuth, async (req, res) => {
    try {
        const restaurant = await RestaurantInfo.findOne();
        res.render('admin/restaurant', {
            adminEmail: req.session.adminEmail,
            restaurant: restaurant || {},
            success: req.query.success === '1',
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('admin/error', {
            message: 'Erreur serveur',
            adminEmail: req.session.adminEmail
        });
    }
});

router.post('/restaurant', requireAuth, async (req, res) => {
    try {
        let restaurant = await RestaurantInfo.findOne();

        const data = {
            name: sanitizeString(req.body.name, 100),
            address: sanitizeString(req.body.address, 200),
            city: sanitizeString(req.body.city, 100),
            postalCode: sanitizeString(req.body.postalCode, 10),
            phone: sanitizeString(req.body.phone, 20),
            email: sanitizeString(req.body.email, 100),
            whatsappLink: sanitizeUrl(req.body.whatsappLink),
            openingHours: sanitizeString(req.body.openingHours, 200),
            heroTagline: sanitizeString(req.body.heroTagline, 100),
            heroDescription: sanitizeString(req.body.heroDescription, 500),
            atmosphereTitle: sanitizeString(req.body.atmosphereTitle, 100),
            atmosphereText: sanitizeString(req.body.atmosphereText, 1000),
            reservationText: sanitizeString(req.body.reservationText, 500),
            instagramUrl: sanitizeUrl(req.body.instagramUrl),
            facebookUrl: sanitizeUrl(req.body.facebookUrl),
            mapUrl: sanitizeUrl(req.body.mapUrl),
            menuFullUrl: sanitizeUrl(req.body.menuFullUrl),
            reservationExternalUrl: sanitizeUrl(req.body.reservationExternalUrl),
            orderOnlineUrl: sanitizeUrl(req.body.orderOnlineUrl),
            whatsappNumber: sanitizeString(req.body.whatsappNumber, 20).replace(/[^0-9+]/g, ''),
            // Delivery platforms
            uberEatsUrl: sanitizeUrl(req.body.uberEatsUrl),
            deliverooUrl: sanitizeUrl(req.body.deliverooUrl),
            // Events
            eventsTitle: sanitizeString(req.body.eventsTitle, 150),
            eventsDescription: sanitizeString(req.body.eventsDescription, 1000),
            eventsCapacity: sanitizeString(req.body.eventsCapacity, 10),
            // Google Maps embed
            mapEmbedUrl: sanitizeUrl(req.body.mapEmbedUrl),
            // Images
            heroImageUrl: sanitizeUrl(req.body.heroImageUrl),
            atmosphereImage1Url: sanitizeUrl(req.body.atmosphereImage1Url),
            atmosphereImage2Url: sanitizeUrl(req.body.atmosphereImage2Url),
            eventsImageUrl: sanitizeUrl(req.body.eventsImageUrl),
            logoUrl: sanitizeUrl(req.body.logoUrl)
        };

        if (restaurant) {
            await restaurant.update(data);
        } else {
            await RestaurantInfo.create(data);
        }

        res.redirect('/admin/restaurant?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/restaurant', {
            adminEmail: req.session.adminEmail,
            restaurant: req.body,
            success: false,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

// ========== MENU ITEMS ==========

router.get('/menu', requireAuth, async (req, res) => {
    try {
        const menuItems = await MenuItem.findAll({ order: [['position', 'ASC']] });
        res.render('admin/menu/index', {
            adminEmail: req.session.adminEmail,
            menuItems,
            success: req.query.success === '1'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('admin/error', {
            message: 'Erreur serveur',
            adminEmail: req.session.adminEmail
        });
    }
});

router.get('/menu/new', requireAuth, (req, res) => {
    res.render('admin/menu/form', {
        adminEmail: req.session.adminEmail,
        menuItem: null,
        isEdit: false,
        error: null
    });
});

router.post('/menu/new', requireAuth, async (req, res) => {
    try {
        const title = sanitizeString(req.body.title, 100);
        const price = req.body.price;

        // Validation
        if (!title) {
            return res.render('admin/menu/form', {
                adminEmail: req.session.adminEmail,
                menuItem: req.body,
                isEdit: false,
                error: 'Le titre est requis'
            });
        }

        if (!validatePrice(price)) {
            return res.render('admin/menu/form', {
                adminEmail: req.session.adminEmail,
                menuItem: req.body,
                isEdit: false,
                error: 'Prix invalide (doit être entre 0 et 9999.99)'
            });
        }

        const maxPosition = await MenuItem.max('position') || 0;

        await MenuItem.create({
            title,
            description: sanitizeString(req.body.description, 500),
            price: parseFloat(price),
            imageUrl: sanitizeUrl(req.body.imageUrl),
            category: sanitizeString(req.body.category, 50),
            isVisible: req.body.isVisible === 'on',
            position: maxPosition + 1
        });

        res.redirect('/admin/menu?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/menu/form', {
            adminEmail: req.session.adminEmail,
            menuItem: req.body,
            isEdit: false,
            error: 'Erreur lors de la création'
        });
    }
});

router.get('/menu/:id/edit', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.redirect('/admin/menu');
        }

        const menuItem = await MenuItem.findByPk(id);
        if (!menuItem) {
            return res.redirect('/admin/menu');
        }
        res.render('admin/menu/form', {
            adminEmail: req.session.adminEmail,
            menuItem,
            isEdit: true,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/menu');
    }
});

router.post('/menu/:id/edit', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.redirect('/admin/menu');
        }

        const menuItem = await MenuItem.findByPk(id);
        if (!menuItem) {
            return res.redirect('/admin/menu');
        }

        const title = sanitizeString(req.body.title, 100);
        const price = req.body.price;

        // Validation
        if (!title) {
            return res.render('admin/menu/form', {
                adminEmail: req.session.adminEmail,
                menuItem: { ...req.body, id },
                isEdit: true,
                error: 'Le titre est requis'
            });
        }

        if (!validatePrice(price)) {
            return res.render('admin/menu/form', {
                adminEmail: req.session.adminEmail,
                menuItem: { ...req.body, id },
                isEdit: true,
                error: 'Prix invalide (doit être entre 0 et 9999.99)'
            });
        }

        await menuItem.update({
            title,
            description: sanitizeString(req.body.description, 500),
            price: parseFloat(price),
            imageUrl: sanitizeUrl(req.body.imageUrl),
            category: sanitizeString(req.body.category, 50),
            isVisible: req.body.isVisible === 'on',
            position: parseInt(req.body.position) || menuItem.position
        });

        res.redirect('/admin/menu?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/menu/form', {
            adminEmail: req.session.adminEmail,
            menuItem: { ...req.body, id: req.params.id },
            isEdit: true,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

router.post('/menu/:id/delete', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.redirect('/admin/menu');
        }

        const menuItem = await MenuItem.findByPk(id);
        if (menuItem) {
            await menuItem.destroy();
        }
        res.redirect('/admin/menu?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/menu');
    }
});

// ========== GALERIE PHOTOS ==========

router.get('/gallery', requireAuth, async (req, res) => {
    try {
        const images = await GalleryImage.findAll({ order: [['position', 'ASC']] });
        res.render('admin/gallery/index', {
            adminEmail: req.session.adminEmail,
            images,
            success: req.query.success === '1'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('admin/error', {
            message: 'Erreur serveur',
            adminEmail: req.session.adminEmail
        });
    }
});

router.get('/gallery/new', requireAuth, (req, res) => {
    res.render('admin/gallery/form', {
        adminEmail: req.session.adminEmail,
        image: null,
        isEdit: false,
        error: null
    });
});

router.post('/gallery/new', requireAuth, async (req, res) => {
    try {
        const imageUrl = sanitizeUrl(req.body.imageUrl);

        if (!imageUrl) {
            return res.render('admin/gallery/form', {
                adminEmail: req.session.adminEmail,
                image: req.body,
                isEdit: false,
                error: 'L\'URL de l\'image est requise'
            });
        }

        const maxPosition = await GalleryImage.max('position') || 0;

        await GalleryImage.create({
            title: sanitizeString(req.body.title, 100),
            imageUrl,
            category: sanitizeString(req.body.category, 50) || 'general',
            isVisible: req.body.isVisible === 'on',
            position: maxPosition + 1
        });

        res.redirect('/admin/gallery?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/gallery/form', {
            adminEmail: req.session.adminEmail,
            image: req.body,
            isEdit: false,
            error: 'Erreur lors de l\'ajout'
        });
    }
});

router.get('/gallery/:id/edit', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.redirect('/admin/gallery');

        const image = await GalleryImage.findByPk(id);
        if (!image) return res.redirect('/admin/gallery');

        res.render('admin/gallery/form', {
            adminEmail: req.session.adminEmail,
            image,
            isEdit: true,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/gallery');
    }
});

router.post('/gallery/:id/edit', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.redirect('/admin/gallery');

        const image = await GalleryImage.findByPk(id);
        if (!image) return res.redirect('/admin/gallery');

        const imageUrl = sanitizeUrl(req.body.imageUrl);
        if (!imageUrl) {
            return res.render('admin/gallery/form', {
                adminEmail: req.session.adminEmail,
                image: { ...req.body, id },
                isEdit: true,
                error: 'L\'URL de l\'image est requise'
            });
        }

        await image.update({
            title: sanitizeString(req.body.title, 100),
            imageUrl,
            category: sanitizeString(req.body.category, 50) || 'general',
            isVisible: req.body.isVisible === 'on',
            position: parseInt(req.body.position) || image.position
        });

        res.redirect('/admin/gallery?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.render('admin/gallery/form', {
            adminEmail: req.session.adminEmail,
            image: { ...req.body, id: req.params.id },
            isEdit: true,
            error: 'Erreur lors de la mise à jour'
        });
    }
});

router.post('/gallery/:id/delete', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.redirect('/admin/gallery');

        const image = await GalleryImage.findByPk(id);
        if (image) await image.destroy();

        res.redirect('/admin/gallery?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/gallery');
    }
});

router.post('/gallery/:id/toggle', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.redirect('/admin/gallery');

        const image = await GalleryImage.findByPk(id);
        if (image) {
            await image.update({ isVisible: !image.isVisible });
        }

        res.redirect('/admin/gallery?success=1');
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/admin/gallery');
    }
});

module.exports = router;
