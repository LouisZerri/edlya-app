# Edlya API - Documentation Complète pour App Mobile React Native

## Base URL
```
Production: https://api.edlya.fr/api
Développement: http://localhost:8000/api
```

---

## Authentification (JWT)

### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "demo@edlya.fr",
  "password": "password"
}
```
**Réponse:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}
```

### Register
```http
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "name": "Jean Dupont",
  "telephone": "0612345678",
  "role": "bailleur",
  "entreprise": "Mon Agence"
}
```

### Headers authentifiés
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Profil utilisateur
```http
GET /api/me
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "id": 1,
  "email": "demo@edlya.fr",
  "name": "Jean Demo",
  "role": "bailleur",
  "telephone": "0612345678",
  "entreprise": null
}
```

### Comptes de test
| Email | Mot de passe |
|-------|--------------|
| demo@edlya.fr | password |
| marie@edlya.fr | password |

---

## GraphQL

**Endpoint:** `POST /api/graphql`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**GraphiQL (explorateur):** `http://localhost:8000/api/graphql/graphiql`

---

## Modèle de données

### Hiérarchie
```
User
├── Logement (1-N)
│   └── EtatDesLieux (1-N)
│       ├── Piece (1-N)
│       │   └── Element (1-N)
│       │       └── Photo (1-N)
│       ├── Compteur (1-N)
│       ├── Cle (1-N)
│       └── Partage (1-N)
```

### User
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| email | string | Email unique |
| name | string | Nom complet |
| telephone | string? | Téléphone |
| role | enum | `admin`, `agent`, `bailleur` |
| entreprise | string? | Nom entreprise |

### Logement
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| nom | string | Nom du logement |
| adresse | string | Adresse |
| codePostal | string | Code postal (5 chiffres) |
| ville | string | Ville |
| type | string? | `studio`, `f1`-`f5`, `t1`-`t5`, `maison_t3`-`maison_t5` |
| surface | float? | Surface en m² |
| nbPieces | int | Nombre de pièces |
| description | text? | Description |
| photoPrincipale | string? | Chemin photo |

### EtatDesLieux
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| logement | IRI | `/api/logements/{id}` |
| type | enum | `entree`, `sortie` |
| dateRealisation | date | Format `YYYY-MM-DD` |
| locataireNom | string | Nom du locataire |
| locataireEmail | string? | Email locataire |
| locataireTelephone | string? | Téléphone locataire |
| observationsGenerales | text? | Observations |
| statut | enum | `brouillon`, `en_cours`, `termine`, `signe` |
| signatureBailleur | text? | SVG base64 |
| signatureLocataire | text? | SVG base64 |
| dateSignatureBailleur | datetime? | |
| dateSignatureLocataire | datetime? | |

### Piece
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| etatDesLieux | IRI | `/api/etat_des_lieuxes/{id}` |
| nom | string | Nom de la pièce |
| ordre | int | Ordre d'affichage (0-based) |
| observations | text? | Observations |
| photos | json? | `[{"chemin": "/uploads/...", "legende": "...", "uploadedAt": "..."}]` |

### Element
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| piece | IRI | `/api/pieces/{id}` |
| type | enum | Voir types ci-dessous |
| nom | string | Nom de l'élément |
| etat | enum | Voir états ci-dessous |
| observations | text? | Observations |
| degradations | json? | `{"liste": ["Trou(s)", "Fissure(s)"]}` |
| ordre | int | Ordre d'affichage |

### Photo
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| element | IRI | `/api/elements/{id}` |
| chemin | string | Chemin du fichier |
| legende | string? | Légende |
| latitude | float? | GPS latitude |
| longitude | float? | GPS longitude |
| ordre | int | Ordre d'affichage |

### Compteur
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| etatDesLieux | IRI | `/api/etat_des_lieuxes/{id}` |
| type | enum | `electricite`, `eau_froide`, `eau_chaude`, `gaz` |
| numero | string? | Numéro compteur |
| indexValue | string? | Valeur index |
| commentaire | text? | |
| photos | json? | `[{"chemin": "/uploads/...", "legende": "...", "uploadedAt": "..."}]` |

### Cle
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| etatDesLieux | IRI | `/api/etat_des_lieuxes/{id}` |
| type | enum | Voir types ci-dessous |
| nombre | int | Quantité (défaut: 1) |
| commentaire | text? | |

### Partage
| Champ | Type | Description |
|-------|------|-------------|
| id | int | ID |
| etatDesLieux | IRI | |
| token | string | Token unique 64 chars |
| email | string? | Email destinataire |
| type | enum | `email`, `lien` |
| expireAt | datetime | Expiration |
| consulteAt | datetime? | Première consultation |

---

## Enums et Constantes

### Types d'éléments
```
sol, mur, plafond, menuiserie, electricite, plomberie,
chauffage, equipement, mobilier, electromenager, autre
```

### États d'éléments (score qualité décroissant)
| État | Score | Badge couleur |
|------|-------|---------------|
| neuf | 6 | vert foncé |
| tres_bon | 5 | vert |
| bon | 4 | vert clair |
| usage | 3 | jaune |
| mauvais | 2 | orange |
| hors_service | 1 | rouge |

### Types de clés
```
porte_entree, boite_lettres, cave, garage, parking,
local_velo, portail, interphone, badge, telecommande, autre
```

### Types de compteurs
```
electricite, eau_froide, eau_chaude, gaz
```

### Statuts EDL (workflow)
```
brouillon → en_cours → termine → signe
```

### Typologies de logement
```
studio, f1, t1, f2, t2, f3, t3, f4, t4, f5, t5,
maison_t3, maison_t4, maison_t5
```

---

## Endpoints REST

### Upload de photos
```http
POST /api/upload/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

element_id: 123 (int, requis)
photo: <file> (requis, max 10Mo, JPEG/PNG/WebP/HEIC)
legende: "Description" (string, optionnel)
ordre: 0 (int, optionnel)
latitude: 48.8566 (float, optionnel)
longitude: 2.3522 (float, optionnel)
```
**Réponse:**
```json
{
  "id": 1,
  "chemin": "photos/abc123.jpg",
  "url": "http://localhost:8000/uploads/photos/abc123.jpg",
  "legende": "Description",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

```http
DELETE /api/upload/photo/{photoId}
Authorization: Bearer <token>
```

### Upload de photos pour compteurs
```http
POST /api/upload/compteur-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

compteur_id: 123 (int, requis)
photo: <file> (requis, max 10Mo, JPEG/PNG/WebP/HEIC)
legende: "Index compteur" (string, optionnel)
```
**Réponse:**
```json
{
  "message": "Photo uploadée avec succès",
  "photo": {
    "chemin": "/uploads/photos/edl-1/compteurs/photo-abc123.jpg",
    "legende": "Index compteur",
    "index": 0
  }
}
```

```http
DELETE /api/upload/compteur-photo/{compteurId}/{photoIndex}
Authorization: Bearer <token>
```
- `compteurId`: ID du compteur
- `photoIndex`: Index de la photo dans le tableau (0-based)

### Upload de photos pour pièces
```http
POST /api/upload/piece-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

piece_id: 123 (int, requis)
photo: <file> (requis, max 10Mo, JPEG/PNG/WebP/HEIC)
legende: "Vue générale" (string, optionnel)
```
**Réponse:**
```json
{
  "message": "Photo uploadée avec succès",
  "photo": {
    "chemin": "/uploads/photos/edl-1/pieces/photo-abc123.jpg",
    "legende": "Vue générale",
    "index": 0
  }
}
```

```http
DELETE /api/upload/piece-photo/{pieceId}/{photoIndex}
Authorization: Bearer <token>
```
- `pieceId`: ID de la pièce
- `photoIndex`: Index de la photo dans le tableau (0-based)

---

### PDF

**Télécharger PDF**
```http
GET /api/edl/{id}/pdf
Authorization: Bearer <token>
→ Content-Disposition: attachment
→ Content-Type: application/pdf
```

**Prévisualiser PDF**
```http
GET /api/edl/{id}/pdf/preview
Authorization: Bearer <token>
→ Content-Disposition: inline
→ Content-Type: application/pdf
```

---

### Comparatif Entrée/Sortie

```http
GET /api/logements/{id}/comparatif
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "logement": { "id": 1, "nom": "Appt Centre", "adresse": "10 rue Paris", "ville": "Lyon" },
  "entree": { "id": 1, "type": "entree", "dateRealisation": "2024-01-01", "statut": "signe" },
  "sortie": { "id": 2, "type": "sortie", "dateRealisation": "2024-12-01", "statut": "termine" },
  "comparatif": {
    "pieces": {
      "Salon": [
        {
          "element": "Sol parquet",
          "type": "sol",
          "entree": { "etat": "bon", "observations": null },
          "sortie": { "etat": "usage", "observations": "Rayures visibles" },
          "evolution": "degrade"
        }
      ]
    },
    "compteurs": [
      {
        "type": "electricite",
        "entree": { "index": "12345" },
        "sortie": { "index": "15678" },
        "consommation": "3333"
      }
    ],
    "cles": [
      { "type": "porte_entree", "entree": 3, "sortie": 2, "difference": -1 }
    ],
    "statistiques": {
      "totalElements": 45,
      "elementsAmeliores": 2,
      "elementsDegrades": 5,
      "elementsIdentiques": 38
    }
  }
}
```

---

### Estimations / Retenues sur caution

```http
GET /api/logements/{id}/estimations
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "logement": { "id": 1, "nom": "Appt Centre" },
  "edlEntree": { "id": 1, "date": "2024-01-01" },
  "edlSortie": { "id": 2, "date": "2024-12-01" },
  "estimations": {
    "degradations": [
      {
        "piece": "Salon",
        "element": "Sol parquet",
        "type": "sol",
        "etatEntree": "bon",
        "etatSortie": "mauvais",
        "estimationGrille": 150,
        "estimationPersonnalisee": null,
        "montantRetenu": 150,
        "observations": "Rayures profondes"
      }
    ],
    "clesManquantes": [
      {
        "type": "porte_entree",
        "quantiteEntree": 3,
        "quantiteSortie": 2,
        "manquantes": 1,
        "coutUnitaire": 25,
        "montant": 25
      }
    ],
    "sousTotal": { "degradations": 350, "cles": 25 },
    "total": 375,
    "grilleUtilisee": { "sol": { "usage": 50, "mauvais": 150, "hors_service": 400 }, ... },
    "coutCleUnitaire": 25
  }
}
```

---

### Typologies & Dégradations

**Liste des typologies**
```http
GET /api/typologies
```
**Réponse:**
```json
[
  { "code": "studio", "nom": "Studio", "nbPieces": 4 },
  { "code": "f2", "nom": "F2 / T2", "nbPieces": 6 },
  { "code": "f3", "nom": "F3 / T3", "nbPieces": 7 },
  { "code": "maison_t4", "nom": "Maison T4", "nbPieces": 10 }
]
```

**Liste des dégradations par type d'élément**
```http
GET /api/degradations
```
**Réponse:**
```json
{
  "mur": ["Trou(s)", "Fissure(s)", "Tache(s)", "Éclats de peinture", "Humidité", "Moisissures", "Papier décollé", "Griffures", "Salissures", "Impacts"],
  "sol": ["Rayure(s)", "Tache(s)", "Usure", "Décollement", "Carreaux cassés", "Joints abîmés", "Gondolement", "Éclats", "Brûlure(s)"],
  "plafond": ["Fissure(s)", "Tache(s)", "Humidité", "Moisissures", "Éclats de peinture", "Affaissement", "Décollement"],
  "menuiserie": ["Vitre fêlée", "Vitre cassée", "Joint défectueux", "Poignée cassée", "Fermeture défectueuse", "Bois abîmé", "Peinture écaillée", "Volet bloqué", "Gonds défectueux"],
  "electricite": ["Prise cassée", "Cache manquant", "Interrupteur cassé", "Ampoule grillée", "Ne fonctionne pas", "Fil apparent", "Détecteur absent"],
  "plomberie": ["Fuite", "Évacuation bouchée", "Joint défectueux", "Robinet fuit", "Calcaire", "Tuyau abîmé", "Siphon bouché", "Chasse d'eau défectueuse"],
  "chauffage": ["Ne chauffe pas", "Fuite", "Thermostat défectueux", "Rouille", "Bruit anormal", "Vanne bloquée", "Purge nécessaire"],
  "equipement": ["Cassé", "Manquant", "Usé", "Sale", "Incomplet", "Rayé", "Fissuré"],
  "mobilier": ["Cassé", "Rayé", "Taché", "Usé", "Porte cassée", "Tiroir cassé", "Charnière défectueuse"],
  "electromenager": ["Ne fonctionne pas", "Bruit anormal", "Fuite", "Sale", "Joint usé", "Vitre cassée", "Bouton cassé"],
  "autre": ["Défectueux", "Manquant", "Cassé", "Usé"]
}
```

**Générer pièces selon typologie**
```http
POST /api/edl/{id}/generer-pieces
Authorization: Bearer <token>
Content-Type: application/json

{ "typologie": "f3" }
```
**Réponse:**
```json
{
  "message": "7 pièces générées",
  "pieces": [
    { "id": 1, "nom": "Entrée", "ordre": 0 },
    { "id": 2, "nom": "Séjour", "ordre": 1 },
    { "id": 3, "nom": "Cuisine", "ordre": 2 },
    { "id": 4, "nom": "Chambre 1", "ordre": 3 },
    { "id": 5, "nom": "Chambre 2", "ordre": 4 },
    { "id": 6, "nom": "Salle de bain", "ordre": 5 },
    { "id": 7, "nom": "WC", "ordre": 6 }
  ]
}
```

---

## Signature Électronique

### Workflow
```
1. Bailleur signe → statut = "termine"
2. Bailleur envoie lien au locataire → email avec token
3. Locataire demande code OTP → email avec code 6 chiffres (15 min)
4. Locataire vérifie code
5. Locataire signe → statut = "signe"
```

### Endpoints Bailleur (authentifié)

**Statut signature**
```http
GET /api/edl/{id}/signature
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "edlId": 1,
  "statut": "termine",
  "signatureBailleur": true,
  "dateSignatureBailleur": "2024-01-15 14:30:00",
  "signatureLocataire": false,
  "dateSignatureLocataire": null,
  "signatureTokenActive": true,
  "signatureTokenExpireAt": "2024-01-17 14:30:00",
  "etape": 3
}
```
**Étapes:** 1=pas signé, 2=bailleur signé, 3=lien envoyé, 4=tout signé

**Signer (bailleur)**
```http
POST /api/edl/{id}/signature/bailleur
Authorization: Bearer <token>
Content-Type: application/json

{ "signature": "data:image/svg+xml;base64,PHN2Zy..." }
```

**Envoyer lien au locataire**
```http
POST /api/edl/{id}/signature/envoyer-lien
Authorization: Bearer <token>
```
→ Envoie un email au locataire avec le lien de signature (valide 48h)

### Endpoints Locataire (publics - sans auth)

**Infos signature**
```http
GET /api/signature/{token}
```
**Réponse:**
```json
{
  "edl": {
    "id": 1,
    "type": "entree",
    "dateRealisation": "2024-01-15",
    "locataireNom": "Jean Dupont",
    "locataireEmail": "j***n@email.com"
  },
  "logement": { "nom": "Appartement Centre", "adresse": "10 rue de Paris", "ville": "Lyon" },
  "bailleur": { "nom": "Marie Martin" },
  "etape": 1,
  "codeVerifie": false
}
```
**Étapes locataire:** 1=demander code, 2=code envoyé, 3=code vérifié (prêt à signer)

**Demander code OTP**
```http
POST /api/signature/{token}/envoyer-code
```

**Vérifier code**
```http
POST /api/signature/{token}/verifier-code
Content-Type: application/json

{ "code": "123456" }
```

**Signer (locataire)**
```http
POST /api/signature/{token}/signer
Content-Type: application/json

{ "signature": "data:image/svg+xml;base64,PHN2Zy..." }
```

---

## Partages

**Lister partages d'un EDL**
```http
GET /api/edl/{id}/partages
Authorization: Bearer <token>
```

**Créer un partage**
```http
POST /api/edl/{id}/partages
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email",
  "email": "destinataire@email.com",
  "expireDays": 7
}
```

**Supprimer un partage**
```http
DELETE /api/partages/{id}
Authorization: Bearer <token>
```

**Accès public EDL (lecture seule)**
```http
GET /api/partage/{token}
```
→ Retourne l'EDL complet avec pièces, éléments, photos, compteurs, clés

**PDF public**
```http
GET /api/partage/{token}/pdf
```

---

## Intelligence Artificielle (OpenAI GPT-4 Vision)

### Vérifier statut IA
```http
GET /api/ai/status
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "configured": true,
  "features": {
    "analyse_photo_piece": true,
    "analyse_degradation": true,
    "import_pdf": true,
    "estimation_ia": true
  }
}
```

### Analyser photo de pièce
Détecte automatiquement les éléments présents dans une photo de pièce.

```http
POST /api/ai/analyser-piece
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file> (ou image_url: "https://...")
nom_piece: "Salon" (optionnel, améliore la précision)
```
**Réponse:**
```json
{
  "success": true,
  "analyse": {
    "piece_detectee": "Salon",
    "elements": [
      {
        "nom": "Parquet chêne",
        "type": "sol",
        "etat": "bon",
        "observations": "Quelques rayures légères visibles",
        "degradations": ["Rayure(s)"]
      },
      {
        "nom": "Mur principal",
        "type": "mur",
        "etat": "tres_bon",
        "observations": "Peinture blanche uniforme",
        "degradations": []
      },
      {
        "nom": "Fenêtre double vitrage",
        "type": "menuiserie",
        "etat": "bon",
        "observations": "Joints en bon état",
        "degradations": []
      }
    ],
    "observations_generales": "Pièce lumineuse et bien entretenue",
    "confiance": 0.85
  }
}
```

### Auto-remplir une pièce depuis photo
Analyse la photo ET crée automatiquement les éléments dans l'EDL.

```http
POST /api/ai/edl/{edlId}/piece/{pieceId}/auto-remplir
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file> (ou image_url: "https://...")
```
**Réponse:**
```json
{
  "success": true,
  "message": "5 éléments créés",
  "piece": { "id": 12, "nom": "Salon" },
  "elements_crees": [
    { "id": 45, "nom": "Parquet chêne", "type": "sol", "etat": "bon", "observations": "..." },
    { "id": 46, "nom": "Mur principal", "type": "mur", "etat": "tres_bon", "observations": "..." }
  ],
  "analyse_complete": { ... }
}
```

### Analyser dégradations sur photo
Analyse une photo d'un élément spécifique pour détecter les dégradations.

```http
POST /api/ai/analyser-degradation
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>
type_element: "mur" (requis)
nom_element: "Mur cuisine" (optionnel)
```
**Réponse:**
```json
{
  "success": true,
  "analyse": {
    "etat_global": "mauvais",
    "degradations_detectees": [
      {
        "type": "Fissure(s)",
        "severite": "importante",
        "localisation": "angle supérieur droit",
        "description": "Fissure diagonale d'environ 30cm"
      },
      {
        "type": "Humidité",
        "severite": "moyenne",
        "localisation": "bas du mur",
        "description": "Traces d'humidité sur 50cm de hauteur"
      }
    ],
    "estimation_reparation": {
      "necessaire": true,
      "type_intervention": "reparation",
      "cout_estime_min": 150,
      "cout_estime_max": 300
    },
    "observations": "Mur nécessitant une intervention rapide",
    "confiance": 0.9
  }
}
```

### Import PDF d'état des lieux
Parse un PDF d'EDL existant et extrait les données.

```http
POST /api/ai/import-pdf
Authorization: Bearer <token>
Content-Type: multipart/form-data

pdf: <file.pdf>
```
**Réponse:**
```json
{
  "success": true,
  "donnees_extraites": {
    "type_edl": "entree",
    "date_realisation": "2024-01-15",
    "logement": {
      "adresse": "10 rue de la Paix",
      "code_postal": "75001",
      "ville": "Paris",
      "type": "f3",
      "surface": 65
    },
    "locataire": {
      "nom": "Jean Dupont",
      "email": "jean@email.com"
    },
    "pieces": [
      {
        "nom": "Entrée",
        "elements": [
          { "nom": "Sol carrelage", "type": "sol", "etat": "bon", "observations": "RAS" }
        ]
      }
    ],
    "compteurs": [
      { "type": "electricite", "numero": "12345", "index": "45678" }
    ],
    "cles": [
      { "type": "porte_entree", "nombre": 3 }
    ]
  }
}
```

### Import PDF + Création automatique EDL
```http
POST /api/ai/import-pdf/creer-edl
Authorization: Bearer <token>
Content-Type: multipart/form-data

pdf: <file.pdf>
logement_id: 1 (requis)
```
**Réponse:**
```json
{
  "success": true,
  "message": "État des lieux créé à partir du PDF",
  "edl": {
    "id": 15,
    "type": "entree",
    "statut": "brouillon",
    "locataireNom": "Jean Dupont",
    "nbPieces": 6
  },
  "donnees_extraites": { ... }
}
```

### Estimations IA (plus précises)
Utilise GPT-4 pour des estimations de réparation détaillées.

```http
GET /api/ai/logements/{id}/estimations
Authorization: Bearer <token>
```
**Réponse:**
```json
{
  "success": true,
  "logement": { "id": 1, "nom": "Appt Centre" },
  "edlEntree": { "id": 1, "date": "2024-01-01" },
  "edlSortie": { "id": 2, "date": "2024-12-01" },
  "estimations_ia": {
    "estimations": [
      {
        "element": "Sol parquet",
        "piece": "Salon",
        "degradation": "Rayures profondes, état passé de bon à mauvais",
        "intervention": "Ponçage et vitrification du parquet",
        "cout_min": 200,
        "cout_max": 400,
        "cout_moyen": 300,
        "justification": "Prix moyen ponçage parquet: 15-25€/m². Pour un salon de ~15m²."
      }
    ],
    "total_min": 450,
    "total_max": 850,
    "total_moyen": 650,
    "recommandations": [
      "Faire établir plusieurs devis pour les travaux importants",
      "Vérifier la vétusté applicable selon l'âge du logement"
    ],
    "avertissement": "Les estimations sont indicatives et peuvent varier selon les prestataires et la région."
  }
}
```

---

## GraphQL - Exemples complets

### Lister les logements
```graphql
query {
  logements {
    edges {
      node {
        id
        nom
        adresse
        codePostal
        ville
        type
        surface
        nbPieces
      }
    }
  }
}
```

### Créer un logement
```graphql
mutation {
  createLogement(input: {
    nom: "Appartement Paris"
    adresse: "10 rue de la Paix"
    codePostal: "75001"
    ville: "Paris"
    type: "f3"
    surface: 65
    nbPieces: 3
  }) {
    logement {
      id
      nom
    }
  }
}
```

### Mettre à jour un logement
```graphql
mutation {
  updateLogement(input: {
    id: "/api/logements/1"
    nom: "Appartement Paris Centre"
    surface: 68
  }) {
    logement {
      id
      nom
      surface
    }
  }
}
```

### Supprimer un logement
```graphql
mutation {
  deleteLogement(input: {
    id: "/api/logements/1"
  }) {
    logement {
      id
    }
  }
}
```

### Créer un EDL
```graphql
mutation {
  createEtatDesLieux(input: {
    logement: "/api/logements/1"
    type: "entree"
    dateRealisation: "2024-01-15"
    locataireNom: "Jean Dupont"
    locataireEmail: "jean@email.com"
    locataireTelephone: "0612345678"
    statut: "brouillon"
  }) {
    etatDesLieux {
      id
      type
      statut
    }
  }
}
```

### Récupérer un EDL complet
```graphql
query {
  etatDesLieux(id: "/api/etat_des_lieuxes/1") {
    id
    type
    dateRealisation
    locataireNom
    locataireEmail
    statut
    observationsGenerales
    signatureBailleur
    signatureLocataire
    logement {
      id
      nom
      adresse
      ville
    }
    pieces {
      edges {
        node {
          id
          nom
          ordre
          observations
          elements {
            edges {
              node {
                id
                nom
                type
                etat
                observations
                degradations
                photos {
                  edges {
                    node {
                      id
                      chemin
                      legende
                      latitude
                      longitude
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    compteurs {
      edges {
        node {
          id
          type
          numero
          indexValue
          commentaire
        }
      }
    }
    cles {
      edges {
        node {
          id
          type
          nombre
          commentaire
        }
      }
    }
  }
}
```

### Créer une pièce
```graphql
mutation {
  createPiece(input: {
    etatDesLieux: "/api/etat_des_lieuxes/1"
    nom: "Salon"
    ordre: 1
  }) {
    piece {
      id
      nom
      ordre
    }
  }
}
```

### Créer un élément
```graphql
mutation {
  createElement(input: {
    piece: "/api/pieces/1"
    type: "sol"
    nom: "Parquet chêne"
    etat: "bon"
    observations: "Quelques rayures légères"
    ordre: 0
  }) {
    element {
      id
      nom
      type
      etat
    }
  }
}
```

### Mettre à jour un élément avec dégradations
```graphql
mutation {
  updateElement(input: {
    id: "/api/elements/1"
    etat: "mauvais"
    observations: "Rayures profondes"
    degradations: "{\"liste\": [\"Rayure(s)\", \"Tache(s)\"]}"
  }) {
    element {
      id
      etat
      degradations
    }
  }
}
```

### Créer un compteur
```graphql
mutation {
  createCompteur(input: {
    etatDesLieux: "/api/etat_des_lieuxes/1"
    type: "electricite"
    numero: "12345678"
    indexValue: "45678"
    commentaire: "Compteur accessible"
  }) {
    compteur {
      id
      type
      numero
      indexValue
    }
  }
}
```

### Supprimer un compteur
```graphql
mutation {
  deleteCompteur(input: {
    id: "/api/compteurs/1"
  }) {
    compteur {
      id
    }
  }
}
```

### Créer une clé
```graphql
mutation {
  createCle(input: {
    etatDesLieux: "/api/etat_des_lieuxes/1"
    type: "porte_entree"
    nombre: 3
    commentaire: "3 clés identiques"
  }) {
    cle {
      id
      type
      nombre
    }
  }
}
```

---

## Notes importantes pour le développement mobile

### 1. Relations GraphQL
Toujours utiliser les IRI pour les relations:
```
"/api/logements/1" (pas juste "1")
"/api/etat_des_lieuxes/1"
"/api/pieces/1"
"/api/elements/1"
```

### 2. Dates
- Format ISO 8601: `YYYY-MM-DD` pour les dates
- Format complet pour datetime: `YYYY-MM-DD HH:mm:ss`

### 3. Signatures
- Format SVG encodé en base64
- Commencer par `data:image/svg+xml;base64,`

### 4. Upload photos
- Utiliser l'endpoint REST `/api/upload/photo` (pas GraphQL)
- Max 10 Mo par fichier
- Formats acceptés: JPEG, PNG, WebP, HEIC

### 5. Token JWT
- Durée de vie: 1 heure
- Renouveler avant expiration
- Stocker de manière sécurisée (SecureStore sur mobile)

### 6. Filtrage automatique
- Toutes les données sont automatiquement filtrées par utilisateur connecté
- Impossible d'accéder aux données d'un autre utilisateur

### 7. Gestion hors-ligne
- Stocker localement les données en cours d'édition
- Synchroniser à la reconnexion
- Gérer les conflits de version

### 8. URLs des images
- Les photos sont accessibles via: `{BASE_URL}/uploads/{chemin}`
- Exemple: `http://localhost:8000/uploads/photos/abc123.jpg`

---

## Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide (validation) |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource non trouvée |
| 410 | Lien expiré (signature) |
| 422 | Erreur de validation |
| 500 | Erreur serveur |
| 503 | Service indisponible (IA non configurée) |

---

## Configuration .env requise (backend)

```env
# Base de données
DATABASE_URL="mysql://root:root@127.0.0.1:3306/edlya-mobile?serverVersion=8.0"

# JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=votre_passphrase

# Email (pour signatures)
MAILER_DSN=smtp://email:password@smtp.gmail.com:587

# OpenAI (pour fonctionnalités IA)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# Application
APP_NAME="Edlya"
APP_FRONTEND_URL="http://localhost:3000"
```
