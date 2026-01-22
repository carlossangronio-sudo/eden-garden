const { Sequelize } = require('sequelize');

// Accepte POSTGRES_URL (Vercel) ou DATABASE_URL (Neon)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERREUR: Variable POSTGRES_URL ou DATABASE_URL non définie');
    process.exit(1);
}

const sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
