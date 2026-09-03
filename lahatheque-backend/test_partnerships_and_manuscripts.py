import os
import django
import io

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.communications.models import PartnershipSubmission, ManuscriptPublicSubmission
from apps.communications.services.email_service import send_transactional_email

ADMIN_NOTIFICATION_EMAILS = [
    "lahaeditions1@gmail.com",
    "alhtdharry7@gmail.com",
    "firinzegbenitodossou@gmail.com",
]

print("=== TEST DEMANDE DE PARTENARIAT ===")
# 1. Test Partnership Flow
partner_org = "Université Nationale des Sciences et Techniques (UNSTIM)"
partner_contact = "Dr. Célestin Diallo"
partner_email = "hervic114@gmail.com"  # Reçoit l'accusé de réception partenaire

# Email Demandeur
res_part_ack = send_transactional_email(
    email_type="partnership_ack",
    to_email=partner_email,
    subject=f"Demande de Partenariat Reçue • LAHAThèque x {partner_org}",
    template_name="emails/partners/partnership_ack.html",
    context={
        "recipient_name": partner_contact,
        "contact_name": partner_contact,
        "organization_name": partner_org,
        "partner_type": "university",
        "partner_type_display": "Université / Faculté / Grande École",
        "country": "BJ",
        "country_name": "Bénin",
        "message": "Nous souhaitons souscrire à un bouquet académique numérique pour 3500 étudiants en Sciences Juridiques et Économiques.",
    },
    recipient_name=partner_contact,
    async_send=False,
)
print("-> Partnership Ack Result:", res_part_ack)

# Email Admins (3 adresses)
res_part_admin = send_transactional_email(
    email_type="partnership_admin_alert",
    to_email=ADMIN_NOTIFICATION_EMAILS,
    subject=f"[Partenariat LAHAThèque] Nouvelle demande : {partner_org} ({partner_contact})",
    template_name="emails/partners/partnership_admin_alert.html",
    context={
        "organization_name": partner_org,
        "contact_name": partner_contact,
        "contact_email": partner_email,
        "contact_phone": "+229 01 97 89 82 42",
        "partner_type": "university",
        "partner_type_display": "Université / Faculté / Grande École",
        "country": "BJ",
        "country_name": "Bénin",
        "message": "Nous souhaitons souscrire à un bouquet académique numérique pour 3500 étudiants en Sciences Juridiques et Économiques.",
    },
    recipient_name="Direction des Partenariats LAHAThèque",
    reply_to=partner_email,
    async_send=False,
)
print("-> Partnership Admin Alert Result:", res_part_admin)

print("\n=== TEST SOUMISSION DE MANUSCRIT (AVEC FICHIER & GESTION SEUIL) ===")
# 2. Test Manuscript Flow
author_name = "Professeur Marc Dossou"
author_email = "hervic114@gmail.com"  # Reçoit la confirmation auteur
book_title = "Traité Pratique du Droit Foncier et Notarial en Afrique de l'Ouest"
reference = "DEP-2026-4891"

# Email Auteur
res_manu_ack = send_transactional_email(
    email_type="manuscript_ack",
    to_email=author_email,
    subject=f"Dépôt de Manuscrit Confirmé • Dossier #{reference} • LAHAThèque",
    template_name="emails/authors/manuscript_ack.html",
    context={
        "recipient_name": author_name,
        "first_name": "Marc",
        "last_name": "Dossou",
        "reference": reference,
        "book_title": book_title,
        "genre": "Essais & Droit",
        "country": "BJ",
        "country_name": "Bénin",
        "summary": "Cet ouvrage examine les dynamiques de sécurisation foncière, les actes notariés et la jurisprudence OHADA sur les transactions immobilières.",
        "file_size_formatted": "4.2 Mo",
    },
    recipient_name=author_name,
    async_send=False,
)
print("-> Manuscript Ack Result:", res_manu_ack)

# Création d'un fichier fictif léger (4 Mo simulé en mémoire) pour test d'attachement direct
dummy_doc_content = b"%PDF-1.4 Mock Manuscript PDF Content for Testing Committee Delivery"

# Email Admins (3 adresses) avec pièce jointe attachée
res_manu_admin = send_transactional_email(
    email_type="manuscript_admin_alert",
    to_email=ADMIN_NOTIFICATION_EMAILS,
    subject=f"[Comité Éditorial] Nouveau manuscrit : « {book_title} » par {author_name} (Réf: {reference})",
    template_name="emails/authors/manuscript_admin_alert.html",
    context={
        "reference": reference,
        "first_name": "Marc",
        "last_name": "Dossou",
        "email": author_email,
        "phone": "+229 01 23 45 67",
        "book_title": book_title,
        "genre": "Essais & Droit",
        "country": "BJ",
        "country_name": "Bénin",
        "summary": "Cet ouvrage examine les dynamiques de sécurisation foncière, les actes notariés et la jurisprudence OHADA sur les transactions immobilières.",
        "file_size_formatted": "4.2 Mo",
        "download_url": "https://lahatheque.com/media/manuscripts/2026/09/Traite_Droit_Foncier.pdf",
        "has_attached_file": True,
    },
    recipient_name="Comité Éditorial LAHAThèque",
    attachments=[{
        "filename": f"Manuscrit_{reference}_Traite_Droit_Foncier.pdf",
        "content": dummy_doc_content,
        "content_type": "application/pdf",
    }],
    reply_to=author_email,
    async_send=False,
)
print("-> Manuscript Admin Alert Result:", res_manu_admin)
print("\n=== TESTS TERMINÉS AVEC SUCCÈS ===")
