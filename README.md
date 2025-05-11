# API Service Auto - Proiect Internship Info World 2025

Acest proiect reprezintă implementarea unui API pentru gestionarea unui service auto. API-ul permite administrarea clienților, mașinilor acestora, programărilor și înregistrărilor service, precum și gestionarea pieselor auto.

## Tehnologii utilizate

- Node.js (v22.3.0)
- Express.js
- JavaScript

── routes/           # Definirea rutelor API
│   ├── clientRoutes.js
│   ├── carRoutes.js
│   ├── appointmentRoutes.js
│   ├── serviceRecordRoutes.js
│   └── partRoutes.js
├── services/         # Servicii pentru interacțiunea cu baza de date
│   └── dbService.js
├── utils/            # Utilitare
│   └── validator.js
├── .nvmrc            # Versiunea Node.js
├── db.json           # Baza de date simulată
├── index.js          # Punctul de intrare al aplicației
├── package.json      # Configurarea pachetelor npm
├── postman-collection.json # Colecția Postman pentru testare
└── README.md         # Documentația proiectului
```

## Instalare și rulare

### Cerințe preliminare

- Node.js (versiunea specificată în `.nvmrc`: v18.12.1)
- npm (Node Package Manager)

### Pași de instalare

1. Clonează repository-ul:
   ```
   git clone <repository-url>
   cd auto-service-api
   ```

2. Instalează dependențele:
   ```
   npm install
   ```

3. Pornește serverul:
   ```
   npm start
   ```

Serverul va rula pe portul 3000 (implicit). Acesta poate fi modificat setând variabila de mediu `PORT`.

## Testare API

Pentru testarea API-ului, se poate utiliza colecția Postman furnizată în fișierul `postman-collection.json`. Aceasta conține exemple pentru toate endpoint-urile implementate.

### Importare colecție în Postman

1. Deschide Postman
2. Apasă butonul "Import"
3. Selectează fișierul `postman-collection.json` din directorul proiectului
4. Toate request-urile vor fi disponibile în colecția "Auto Service API"

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
- Creare client nou
- Actualizare client
- Activare/dezactivare client
- Ștergere client

### Administrare mașini

- Obținere listă mașini
- Obținere mașină după ID
- Creare mașină nouă
- Actualizare mașină
- Activare/dezactivare mașină
- Ștergere mașină

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
- Ștergere înregistrare service

### Administrare piese

- Obținere listă piese
- Obținere categorii piese
- Obținere piesă după ID
- Creare piesă nouă
- Actualizare piesă
- Activare/dezactivare piesă
- Actualizare stoc piesă
- Ștergere piesă

## Funcționalitate în plus

Pe lângă cerințele de bază, am implementat următoarele funcționalități adiționale:

1. **Sistem complet de autentificare cu JWT** - Implementarea autentificării bazate pe token pentru securizarea API-ului, cu roluri diferite (admin, tehnician, client) și permisiuni corespunzătoare.

2. **Gestionare administratori** - Posibilitatea de a crea și gestiona administratori și tehnicieni, cu roluri diferite și drepturi de acces diferențiate.

3. **Gestionarea detaliată a stocului de piese** - API-ul permite adăugarea, scăderea sau setarea directă a cantităților pentru piese, cu validări pentru a preveni stocul negativ.

4. **Sistem de validare robust** - Utilitarul `validator.js` oferă un mecanism flexibil și extensibil pentru validarea datelor, asigurând integritatea informațiilor stocate.

5. **Răspunsuri îmbogățite pentru programări și înregistrări service** - La interogarea acestor entități, API-ul returnează automat și informații despre client și mașină, reducând numărul de cereri necesare.

6. **Tratarea erorilor și răspunsuri detailate** - Fiecare endpoint implementează tratarea detaliată a erorilor și returnează mesaje informative, facilitând debugging-ul și integrarea cu alte aplicații.

7. **Evitarea ștergerii entităților referențiate** - API-ul previne ștergerea clienților care au mașini, mașinilor care au programări, programărilor care au înregistrări service, ceea ce asigură integritatea referențială a datelor.

## Autentificare

API-ul folosește autentificare bazată pe token JWT pentru securizarea endpoint-urilor. Flow-ul de autentificare este următorul:

1. Utilizatorii se pot înregistra prin endpoint-ul `/api/auth/register` (doar pentru clienți)
2. Administratorii pot fi creați doar de către alți administratori prin `/api/auth/admin`
3. Utilizatorii se autentifică prin endpoint-ul `/api/auth/login` și primesc un token JWT
4. Tokenul trebuie inclus în header-ul `Authorization` pentru toate cererile ulterioare, în formatul `Bearer <token>`

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

## Notă

Acest proiect simulează baza de date prin intermediul unui fișier JSON (`db.json`), datele fiind manipulate prin intermediul serviciului `dbService.js`. Toate operațiunile CRUD sunt implementate pentru fiecare entitate, cu validări corespunzătoare.

Parolele sunt hashuite folosind bcrypt înainte de a fi stocate în baza de date pentru securitate. Pentru testare, toate conturile existente în db.json au parola "password123".
