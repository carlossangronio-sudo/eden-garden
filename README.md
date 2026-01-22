# Eden Garden - Restaurant Bar Chicha Nice

Site vitrine dynamique avec espace d'administration pour Eden Garden.

## Installation

```bash
# Installer les dépendances
npm install

# Initialiser la base de données avec les données de démo
npm run seed

# Lancer le serveur
npm start
```

Le serveur démarre sur **http://localhost:3000**

## Accès Administration

- **URL:** http://localhost:3000/admin
- **Email:** `admin@edengarden.fr`
- **Mot de passe:** `admin123`

## Fonctionnalités

### Site Public (/)
- Page vitrine avec design original conservé
- Menu dynamique depuis la base de données
- Informations restaurant modifiables

### Espace Admin (/admin)
- **Dashboard:** Vue d'ensemble avec accès rapide
- **Menu:** Ajouter/modifier/supprimer des plats
- **Restaurant:** Modifier les textes et informations

## Structure

```
eden-garden/
├── config/
│   └── database.js      # Config SQLite
├── middleware/
│   └── auth.js          # Authentification
├── models/
│   ├── AdminUser.js
│   ├── MenuItem.js
│   ├── RestaurantInfo.js
│   └── index.js
├── routes/
│   ├── admin.js         # Routes admin
│   └── public.js        # Routes publiques
├── seeders/
│   └── seed.js          # Données initiales
├── views/
│   ├── admin/           # Templates admin
│   └── index.ejs        # Page publique
├── server.js
└── package.json
```

## Technologies

- **Backend:** Node.js + Express
- **Base de données:** SQLite (Sequelize ORM)
- **Templates:** EJS
- **Auth:** bcrypt + express-session
