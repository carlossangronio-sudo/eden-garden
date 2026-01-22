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
    ssl: isProduction ? { rejectUnauthorized: false } : false
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
