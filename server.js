require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');
const { sequelize } = require('./models');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Pool PostgreSQL pour les sessions
const pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust proxy (Vercel/nginx)
if (isProduction) {
    app.set('trust proxy', 1);
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session store PostgreSQL
const sessionStore = new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
});

// Session sécurisée
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'eden.sid',
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Middleware CSRF simple
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
});

// Vérification CSRF pour les routes admin POST
app.use('/admin', (req, res, next) => {
    if (req.method === 'POST') {
        const token = req.body._csrf || req.headers['x-csrf-token'];
        if (!token || token !== req.session.csrfToken) {
            if (req.path !== '/login') {
                return res.status(403).render('admin/error', {
                    message: 'Token de sécurité invalide. Veuillez rafraîchir la page.',
                    adminEmail: req.session.adminEmail
                });
            }
        }
    }
    next();
});

// Initialisation de la base de données (une seule fois par instance)
let dbInitialized = false;

async function initializeDatabase() {
    if (dbInitialized) return;

    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync({ alter: true });
        console.log('Models synchronized');

        dbInitialized = true;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Middleware pour initialiser la DB avant les routes
app.use(async (req, res, next) => {
    try {
        await initializeDatabase();
        next();
    } catch (error) {
        console.error('DB init error:', error);
        res.status(500).render('error', { message: 'Erreur de connexion à la base de données' });
    }
});

// Route seed (à supprimer après usage)
app.get('/api/seed', async (req, res) => {
    const bcrypt = require('bcrypt');
    const logs = [];
    const log = (msg) => { console.log(msg); logs.push(msg); };

    try {
        log('1. Seed started');
        log('2. Dropping old tables...');

        await sequelize.query(`DROP TABLE IF EXISTS menu_items CASCADE`);
        await sequelize.query(`DROP TABLE IF EXISTS admin_users CASCADE`);
        await sequelize.query(`DROP TABLE IF EXISTS restaurant_info CASCADE`);
        log('3. Tables dropped');

        log('4. Syncing models...');
        await sequelize.sync({ force: true });
        log('5. Models synced');

        const { RestaurantInfo, MenuItem, AdminUser } = require('./models');

        log('6. Creating admin...');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@edengarden.fr';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        await AdminUser.create({ email: adminEmail, passwordHash });
        log('7. Admin created: ' + adminEmail);

        log('8. Creating restaurant info...');
        await RestaurantInfo.create({
            name: 'Eden Garden',
            address: '30 Quai Lunel',
            city: 'Nice',
            postalCode: '06300',
            phone: '04 93 XX XX XX',
            openingHours: 'Mer-Dim: 12h-00h30',
            heroTagline: 'Nice Port · France',
            heroDescription: 'Restaurant Bar Lounge & Chicha Premium'
        });
        log('9. Restaurant created');

        log('10. Creating menu items...');
        await MenuItem.bulkCreate([
            { title: 'Poulet Yassa', description: 'Cuisse de poulet marinée', price: 18, category: 'Plat', isVisible: true, position: 1 },
            { title: 'Rougail Saucisse', description: 'Saucisses fumées', price: 19, category: 'Plat', isVisible: true, position: 2 },
            { title: 'Mix Grill Eden', description: 'Assortiment royal', price: 28, category: 'Plat', isVisible: true, position: 3 }
        ]);
        log('11. Menu created');
        log('12. SEED COMPLETE!');

        res.json({ success: true, admin: adminEmail, logs });
    } catch (error) {
        log('ERROR: ' + error.message);
        res.status(500).json({ error: error.message, stack: error.stack, logs });
    }
});

// Route pour mettre à jour les données complètes (à supprimer après usage)
app.get('/api/update-data', async (req, res) => {
    try {
        const { RestaurantInfo, MenuItem } = require('./models');

        // Mettre à jour les infos restaurant
        const restaurant = await RestaurantInfo.findOne();
        if (restaurant) {
            await restaurant.update({
                name: 'Eden Garden',
                address: '30 Quai Lunel',
                city: 'Nice',
                postalCode: '06300',
                phone: '+33 4 93 56 XX XX',
                email: 'contact@edengarden-nice.fr',
                openingHours: 'Mer-Dim: 12h00-00h30 | Lun-Mar: Fermé',
                heroTagline: 'Nice Port · France',
                heroDescription: 'Une fusion audacieuse entre la gastronomie afro-réunionnaise et l\'élégance de la vie nocturne azuréenne. Restaurant, Bar Lounge & Chicha Premium.',
                atmosphereTitle: 'Plus qu\'un restaurant, un lieu de vie.',
                atmosphereText: 'L\'Eden Garden redéfinit vos soirées à Nice. Commencez par un dîner aux saveurs épicées, poursuivez avec un cocktail créatif sur notre terrasse face au port, et terminez en beauté avec une chicha Kaloud premium devant les plus grands matchs.',
                reservationText: 'Pour le dîner ou pour le lounge, assurez-vous d\'avoir la meilleure place. Réservation instantanée sans prépaiement.',
                instagramUrl: 'https://instagram.com/edengardennice',
                facebookUrl: 'https://facebook.com/edengardennice',
                mapUrl: 'https://maps.google.com/?q=30+Quai+Lunel+06300+Nice',
                uberEatsUrl: 'https://www.ubereats.com/fr/store/eden-garden/QWGcdg7XWze-UTEhFUTC0A',
                deliverooUrl: 'https://deliveroo.fr/fr/menu/nice/nice-vieux-nice/eden-garden-nice',
                eventsTitle: 'Privatisez l\'Eden pour vos moments uniques',
                eventsDescription: 'Anniversaires, afterworks, soirées privées, événements d\'entreprise... Notre équipe vous accompagne pour créer une expérience sur mesure dans un cadre exceptionnel face au Port de Nice.',
                eventsCapacity: '50',
                whatsappNumber: '33652826430'
            });
        }

        // Mettre à jour les items menu avec descriptions complètes
        await MenuItem.update(
            { description: 'Cuisse de poulet marinée au citron vert, oignons confits, olives, servi avec riz blanc parfumé.', imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800' },
            { where: { title: 'Poulet Yassa' } }
        );
        await MenuItem.update(
            { description: 'Saucisses fumées traditionnelles, mijotées dans une sauce tomate aux épices réunionnaises.', imageUrl: 'https://images.unsplash.com/photo-1594910091040-5b481358c279?w=800' },
            { where: { title: 'Rougail Saucisse' } }
        );
        await MenuItem.update(
            { description: 'Assortiment royal : Agneau, Poulet, Merguez, accompagné d\'alloco et sauce verte maison.', imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800' },
            { where: { title: 'Mix Grill Eden' } }
        );

        // Ajouter Signature Cocktails si pas présent
        const cocktail = await MenuItem.findOne({ where: { title: 'Signature Cocktails' } });
        if (!cocktail) {
            await MenuItem.create({
                title: 'Signature Cocktails',
                description: 'Découvrez notre carte de cocktails créatifs, avec ou sans alcool.',
                price: 12.00,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800',
                category: 'Cocktail',
                isVisible: true,
                position: 4
            });
        }

        res.json({ success: true, message: 'Données mises à jour!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Gestionnaire d'erreurs 404
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).render('error', { message: 'Erreur serveur' });
});

// En mode développement local, démarrer le serveur
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    initializeDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`\nEden Garden server running at http://localhost:${PORT}`);
            console.log(`Admin panel: http://localhost:${PORT}/admin`);
            console.log('\nMode: DEVELOPMENT');
            console.log('\nPress Ctrl+C to stop\n');
        });
    }).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

// Export pour Vercel serverless
module.exports = app;
