const { Sequelize } = require('sequelize');

// Utiliser POSTGRES_URL de Vercel ou DATABASE_URL en local
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERREUR: Variable POSTGRES_URL ou DATABASE_URL non définie');
    console.error('Définissez-la dans votre fichier .env ou dans les variables Vercel');
    process.exit(1);
}

const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false // Nécessaire pour Vercel Postgres
        } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
