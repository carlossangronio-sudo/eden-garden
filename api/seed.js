// Route de seed pour Vercel - À utiliser UNE SEULE FOIS après déploiement
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, RestaurantInfo, MenuItem, AdminUser } = require('../models');

module.exports = async (req, res) => {
    // Clé optionnelle pour sécuriser (si SEED_SECRET_KEY est définie)
    const seedKey = req.query.key || req.headers['x-seed-key'];
    const expectedKey = process.env.SEED_SECRET_KEY;

    if (expectedKey && seedKey !== expectedKey) {
        return res.status(403).json({ error: 'Clé de seed invalide' });
    }

    try {
        // Sync database (force: true supprime les tables existantes)
        await sequelize.sync({ force: true });

        // Créer l'utilisateur admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@edengarden.fr';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await AdminUser.create({
            email: adminEmail,
            passwordHash
        });

        // Créer les infos du restaurant
        await RestaurantInfo.create({
            name: 'Eden Garden',
            address: '30 Quai Lunel',
            city: 'Nice',
            postalCode: '06300',
            phone: '04 93 XX XX XX',
            openingHours: 'Mer-Dim: 12h-00h30 | Lun-Mar: Ferme',
            heroTagline: 'Nice Port · France',
            heroDescription: 'Une fusion audacieuse entre la gastronomie afro-reunionnaise et l\'elegance de la vie nocturne azureenne.',
            atmosphereTitle: 'Plus qu\'un restaurant, un lieu de vie.',
            atmosphereText: 'L\'Eden Garden redefinit vos soirees a Nice.',
            reservationText: 'Reservation instantanee sans prepaiement.',
            uberEatsUrl: 'https://www.ubereats.com/fr/store/eden-garden/QWGcdg7XWze-UTEhFUTC0A',
            deliverooUrl: 'https://deliveroo.fr/fr/menu/nice/nice-vieux-nice/eden-garden-nice',
            eventsTitle: 'Privatisez l\'Eden pour vos moments uniques',
            eventsDescription: 'Anniversaires, afterworks, soirees privees...',
            eventsCapacity: '50'
        });

        // Créer les items du menu
        await MenuItem.bulkCreate([
            { title: 'Poulet Yassa', description: 'Cuisse de poulet marinée au citron vert', price: 18.00, category: 'Plat', isVisible: true, position: 1 },
            { title: 'Rougail Saucisse', description: 'Saucisses fumées traditionnelles', price: 19.00, category: 'Plat', isVisible: true, position: 2 },
            { title: 'Mix Grill Eden', description: 'Assortiment royal', price: 28.00, category: 'Plat', isVisible: true, position: 3 },
            { title: 'Signature Cocktails', description: 'Cocktails créatifs', price: 12.00, category: 'Cocktail', isVisible: true, position: 4 }
        ]);

        res.status(200).json({
            success: true,
            message: 'Seed OK! Admin: ' + adminEmail
        });

    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            error: 'Erreur seed',
            details: error.message,
            stack: error.stack
        });
    }
};
