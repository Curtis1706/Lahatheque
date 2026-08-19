# Quickstart Guide: Module 009 - API Lecteur Heberge

**Feature**: Module 009 - API Lecteur Heberge  
**Prerequisites**: Django Backend demarre sur port 8000, Next.js Frontend demarre sur port 3000

---

## 1. Scenario de Validation End-to-End

### Etape 1 : Obtenir un Jeton d'Acces Partenaire (OAuth2)

```bash
curl -X POST http://localhost:8000/api/v1/oauth2/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=VOTRE_CLIENT_ID&client_secret=VOTRE_CLIENT_SECRET&scope=reader:sessions"
```

### Etape 2 : Creer une Session de Lecture Personnalisee avec Quiz

```bash
curl -X POST http://localhost:8000/api/v1/reader/sessions/ \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "1",
    "external_user_ref": "etudiant-001",
    "external_user_name": "Amina Traore",
    "return_url": "http://localhost:3000/catalog",
    "theme": {
      "brand_name": "Universite Numerique Africaine",
      "primary_color": "#1B2A4E",
      "accent_color": "#B08D42"
    },
    "quiz": {
      "enabled": true,
      "title": "Quiz de Comprehension - Chapitre 1",
      "passing_score_percent": 75,
      "questions": [
        {
          "id": "q1",
          "question": "Quelle est la theorie principale discutee dans ce chapitre ?",
          "options": ["L'auto-amelioration recursive", "La compilation statique", "Le clustering K-Means"],
          "correct_answer_index": 0,
          "explanation": "L'auteur introduit l'auto-amelioration recursive des le debut de l'ouvrage."
        }
      ]
    }
  }'
```

**Reponse Attendue** :
```json
{
  "success": true,
  "data": {
    "session_id": "rs_...",
    "reader_url": "http://localhost:3000/read/eyJhbGciOiJIUzI1Ni...",
    "expires_at": "2026-08-19T02:30:00Z",
    "book": {
      "id": "1",
      "title": "Promptbreeder",
      "total_pages": 64
    }
  },
  "error": null
}
```

### Etape 3 : Ouvrir l'URL dans le Navigateur

1. Ouvrir `reader_url` dans le navigateur.
2. Verifier l'application du theme (titre, couleurs, logo).
3. Verifier la presence du filigrane nominatif (*Amina Traore*).
4. Verifier la bascule entre Mode Immersion 3D et Mode Normal.
5. Arriver a la derniere page, valider le quiz, et cliquer sur Quitter pour revenir sur `return_url`.
