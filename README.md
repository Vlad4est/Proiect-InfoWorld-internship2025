# Auto Service API

API RESTful pentru gestionarea unui service auto, implementat cu Node.js și Express.

## Cuprins

- [Descriere](#descriere)
- [Tehnologii utilizate](#tehnologii-utilizate)
- [Instalare](#instalare)
- [Structura proiectului](#structura-proiectului)
- [Autentificare](#autentificare)
- [Testare API](#testare-api)
- [Funcționalități implementate](#funcționalități-implementate)

## Descriere

Acest proiect reprezintă un API pentru gestionarea unui service auto. API-ul permite administrarea clienților, mașinilor acestora, programărilor și înregistrărilor service, precum și gestionarea pieselor auto. Implementează un sistem complet de autentificare cu JWT și roluri diferite pentru utilizatori.

## Tehnologii utilizate

- **Node.js** (v18.12.1)
- **Express.js** - Framework pentru API
- **JWT** (JSON Web Tokens) - Pentru autentificare
- **bcrypt** - Pentru hash-uirea parolelor
- **JSON** - Pentru stocarea datelor (simulare bază de date)

## Instalare

### Cerințe preliminare

- Node.js (v18.12.1 sau mai recent)
- npm (Node Package Manager)

### Pași de instalare

1. Clonează repository-ul:
   ```bash
   git clone <repository-url>
   cd auto-service-api
   ```

2. Instalează dependențele:
   ```bash
   npm install
   ```

3. Configurare:
   - Verifică fișierul `.env` pentru configurările aplicației (PORT, JWT_SECRET, etc.)
   - Poți modifica aceste setări după necesități

4. Populează baza de date cu date inițiale:
   ```bash
   npm run populate-db
   ```
   Acest script va crea un fișier `db.json` cu date de test, inclusiv:
   - Admin: username=`admin`, password=`password123`
   - Tehnician: username=`tehnician`, password=`password123`
   - Clienți: username=`ion.popescu` și `maria.ionescu`, password=`password123`

5. Pornește serverul:
   ```bash
   npm start
   ```
   API-ul va fi disponibil la adresa `http://localhost:3000`

## Structura proiectului

```
auto-service-api/
├── controllers/       # Controllere pentru fiecare entitate
│   ├── authController.js
│   ├── clientController.js
│   ├── carController.js
│   ├── appointmentController.js
│   ├── serviceRecordController.js
│   └── partController.js
├── middleware/        # Middleware-uri
│   └── authMiddleware.js
├── routes/           # Definirea rutelor API
│   ├── authRoutes.js
│   ├── clientRoutes.js
│   ├── carRoutes.js
│   ├── appointmentRoutes.js
│   ├── serviceRecordRoutes.js
│   └── partRoutes.js
├── services/         # Servicii pentru interacțiunea cu baza de date
│   └── dbService.js
├── utils/            # Utilitare
│   ├── validator.js
│   └── authUtils.js
├── scripts/          # Scripturi utilitare
│   └── populateDb.js
├── .nvmrc            # Versiunea Node.js
├── .env              # Variabile de mediu
├── .gitignore        # Fișiere excluse din repository
├── db.json           # Baza de date simulată (generată)
├── index.js          # Punctul de intrare al aplicației
├── package.json      # Configurarea pachetelor npm
├── postman_collection.json # Colecția Postman pentru testare
└── README.md         # Documentația proiectului
```

## Autentificare

API-ul folosește autentificare bazată pe token JWT pentru securizarea endpoint-urilor.

### Obținere token

```
POST /api/auth/login
```
Body:
```json
{
  "username": "admin",
  "password": "password123"
}
```

### Folosire token

Adaugă header-ul de autorizare la toate cererile:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roluri și permisiuni

API-ul implementează trei roluri cu permisiuni diferite:

1. **Client**
   - Poate vedea și gestiona doar propriul profil și propriile mașini
   - Poate crea și gestiona programări pentru mașinile proprii
   - Nu poate accesa înregistrările service sau piesele

2. **Tehnician**
   - Poate vedea toți clienții și toate mașinile
   - Poate vedea toate programările
   - Poate gestiona înregistrările service și piesele

3. **Admin**
   - Are acces complet la toate resursele
   - Poate crea și gestiona alți administratori și tehnicieni
   - Poate activa/dezactiva utilizatori

## Testare API

Proiectul include o colecție Postman pentru testare simplă a API-ului.

### Folosirea colecției Postman

1. Importă fișierul `postman_collection.json` în Postman
2. Creează un environment nou și selectează-l
3. Execută cererea "Login" pentru a obține automat un token (se salvează automat în variabila `token`)
4. Folosește celelalte cereri care vor utiliza token-ul salvat

### Fluxuri principale de testare

1. **Autentificare**:
   - Login ca admin
   - Verificare profil
   - Creare administrator nou

2. **Administrare clienți**:
   - Obținere listă clienți
   - Adăugare client nou (prin register)
   - Detalii client
   - Actualizare client

3. **Administrare mașini**:
   - Obținere listă mașini
   - Adăugare mașină nouă
   - Asociere cu client

4. **Programări**:
   - Creare programare
   - Actualizare programare
   - Vizualizare programări

5. **Service**:
   - Creare înregistrare service pentru o programare
   - Adăugare informații procesare
   - Finalizare service

## Funcționalități implementate

### Autentificare și gestionare utilizatori

- Înregistrare client
- Autentificare utilizatori (clienți și administratori) cu JWT
- Obținere profil utilizator autentificat
- Actualizare parolă
- Gestionare administratori (creare, listare, activare/dezactivare)
- Roluri diferite (admin, tehnician, client) cu permisiuni corespunzătoare

### Administrare clienți

- Obținere listă clienți
- Obținere client după ID
- Obținere mașini pentru un client
- Actualizare client
- Activare/dezactivare client

### Administrare mașini

- Obținere listă mașini
- Obținere mașină după ID
- Creare mașină nouă
- Actualizare mașină
- Activare/dezactivare mașină

### Programări clienți

- Obținere listă programări
- Obținere programare după ID
- Creare programare nouă
- Actualizare programare
- Ștergere programare

### Istoric service

- Obținere listă înregistrări service
- Obținere înregistrare service după ID
- Creare înregistrare service nouă (primire mașină)
- Adăugare informații procesare (operațiuni efectuate)
- Actualizare înregistrare service

### Administrare piese

- Obținere listă piese
- Obținere categorii piese
- Obținere piesă după ID
- Creare piesă nouă
- Actualizare piesă
- Actualizare stoc piesă

---

Dezvoltat ca proiect pentru Internship Info World 2025.
