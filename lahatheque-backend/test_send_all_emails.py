"""
Script de test d'envoi réel de l'ensemble des 11 typologies d'emails transactionnels
vers les adresses de test : hervic114@gmail.com et alhtdharry7@gmail.com.
"""
import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.communications.services.email_service import EmailService

TEST_RECIPIENTS = ["hervic114@gmail.com", "alhtdharry7@gmail.com"]
RECIPIENT_NAME = "Direction & Équipe LAHAThèque"

print(f"=== DÉBUT DE LA CAMPAGNE D'ENVOI D'EMAILS DE TEST VERS {TEST_RECIPIENTS} ===")

for recipient in TEST_RECIPIENTS:
    print(f"\n========================================================")
    print(f"  EXPÉDITION DES 11 FLUX VERS : {recipient}")
    print(f"========================================================")

    # 1. Confirmation de Commande B2C avec Facture PDF jointe
    print("\n[1/11] Envoi : Confirmation de Commande B2C avec Facture PDF...")
    res1 = EmailService.send(
        email_type="order_confirmation_client",
        to_email=recipient,
        subject="Confirmation de votre commande #CMD-2026-8942 • Facture Acquittée",
        template_name="emails/orders/confirmation_client.html",
        context={
            "order_number": "CMD-2026-8942",
            "order_date": "03/09/2026",
            "items": [
                {"title": "Traité de Droit Civil Béninois & Africain (Tome 1)", "quantity": 1, "total": 7500},
                {"title": "Précis d'Économie Monétaire & Bancaire", "quantity": 1, "total": 5000}
            ],
            "total_amount": "12 500",
            "currency": "FCFA",
            "is_physical": False,
        },
        recipient_name=RECIPIENT_NAME,
        pdf_invoice_data={
            "order_number": "CMD-2026-8942",
            "customer_name": RECIPIENT_NAME,
            "customer_email": recipient,
            "customer_address": "Campus Universitaire d'Abomey-Calavi, Bénin",
            "date": "03/09/2026",
            "items": [
                {"title": "Traité de Droit Civil Béninois & Africain (Tome 1)", "quantity": 1, "unit_price": 7500, "total": 7500},
                {"title": "Précis d'Économie Monétaire & Bancaire", "quantity": 1, "unit_price": 5000, "total": 5000}
            ],
            "total_amount": 12500,
            "currency": "FCFA",
            "payment_method": "MTN Mobile Money",
            "is_paid": True,
        }
    )
    print(f"-> Résultat 1: Success={res1.success}, Provider={res1.provider}, ID={res1.message_id}")
    time.sleep(1)

    # 2. Bon de Commande Grossiste B2B avec Facture Proforma PDF jointe
    print("\n[2/11] Envoi : Bon de Commande Grossiste B2B avec Proforma PDF...")
    res2 = EmailService.send(
        email_type="order_confirmation_wholesaler",
        to_email=recipient,
        subject="Validation Commande B2B #GRS-2026-104 • Facture Proforma Jointe",
        template_name="emails/orders/confirmation_wholesaler.html",
        context={
            "order_number": "GRS-2026-104",
            "company_name": "Librairie Universitaire Notre-Dame",
            "total_units": 50,
            "discount_rate": 25,
            "total_amount": "187 500",
            "currency": "FCFA",
            "is_credit": True,
            "payment_due_date": "03/10/2026 (Net 30 jours)",
        },
        recipient_name=RECIPIENT_NAME,
        pdf_invoice_data={
            "order_number": "GRS-2026-104",
            "customer_name": "Librairie Universitaire Notre-Dame",
            "customer_email": recipient,
            "customer_address": "Avenue Pape Jean-Paul II, Cotonou",
            "date": "03/09/2026",
            "items": [
                {"title": "Pack 50 Manuels de Mathématiques Générales", "quantity": 50, "unit_price": 3750, "total": 187500}
            ],
            "total_amount": 187500,
            "currency": "FCFA",
            "payment_method": "Achat à Crédit B2B (Net 30j)",
            "is_paid": False,
        }
    )
    print(f"-> Résultat 2: Success={res2.success}, Provider={res2.provider}, ID={res2.message_id}")
    time.sleep(1)

    # 3. Avis d'Expédition de Commande Papier avec Tracking
    print("\n[3/11] Envoi : Avis d'Expédition Logistique avec Suivi...")
    res3 = EmailService.send(
        email_type="order_shipped",
        to_email=recipient,
        subject="Votre colis est en route • Commande #CMD-2026-8942",
        template_name="emails/orders/order_shipped.html",
        context={
            "order_number": "CMD-2026-8942",
            "carrier_name": "Express Courrier Bénin / DHL",
            "tracking_number": "LAHA-BJ-98234710",
            "shipping_address": "Campus Universitaire d'Abomey-Calavi, Bâtiment FADESP",
            "estimated_delivery": "Demain avant 14h00",
            "tracking_url": "https://lahatheque.com/student/orders",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 3: Success={res3.success}, Provider={res3.provider}, ID={res3.message_id}")
    time.sleep(1)

    # 4. Création Manuelle de Compte par l'Admin avec Identifiants
    print("\n[4/11] Envoi : Création de Compte avec Identifiants Temporaires...")
    res4 = EmailService.send(
        email_type="account_created_by_admin",
        to_email=recipient,
        subject="Bienvenue sur LAHAThèque — Vos identifiants d'accès (Auteur Partenaire)",
        template_name="emails/auth/account_created_by_admin.html",
        context={
            "email": recipient,
            "temporary_password": "Laha#Secure2026!",
            "role_display": "Auteur Partenaire • LAHA Éditions",
            "login_url": "https://lahatheque.com/login",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 4: Success={res4.success}, Provider={res4.provider}, ID={res4.message_id}")
    time.sleep(1)

    # 5. Message Administratif Direct (SendEmailModal)
    print("\n[5/11] Envoi : Message Administratif Direct de la Direction...")
    res5 = EmailService.send(
        email_type="admin_custom_user_email",
        to_email=recipient,
        subject="Information Importante concernant votre convention d'édition 2026",
        template_name="emails/admin/custom_message.html",
        context={
            "custom_subject": "Information Importante concernant votre convention d'édition 2026",
            "message_body": (
                "Nous avons le plaisir de vous informer que votre nouveau recueil d'articles académiques "
                "a été validé par le comité scientifique avec les félicitations du jury.\n\n"
                "La mise en page définitive et l'épreuve BAT numérique sont désormais consultables "
                "dans votre espace dédié pour signature électronique."
            ),
            "action_url": "https://lahatheque.com/author/submissions",
            "action_text": "Consulter mon épreuve BAT",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 5: Success={res5.success}, Provider={res5.provider}, ID={res5.message_id}")
    time.sleep(1)

    # 6. Accusé de Réception Dialogue Aide & Contact
    print("\n[6/11] Envoi : Accusé de Réception Support & Assistance Client...")
    res6 = EmailService.send(
        email_type="support_contact_ack",
        to_email=recipient,
        subject="Accusé de réception • Votre demande d'assistance #TK-8419",
        template_name="emails/support/contact_ack.html",
        context={
            "subject_text": "Question sur la synchronisation hors-ligne de la liseuse",
            "message_body": "Bonjour, je souhaiterais savoir comment activer le mode lecture hors-ligne sur ma tablette Android pour mes cours de droit.",
            "ticket_id": "TK-8419",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 6: Success={res6.success}, Provider={res6.provider}, ID={res6.message_id}")
    time.sleep(1)

    # 7. Alerte Interne Support Client
    print("\n[7/11] Envoi : Alerte Interne Équipe Support...")
    res7 = EmailService.send(
        email_type="support_internal_alert",
        to_email=recipient,
        subject=f"[Support LAHAThèque] Nouveau message de Hervic (Étudiant) : Question liseuse",
        template_name="emails/support/internal_alert.html",
        context={
            "sender_name": RECIPIENT_NAME,
            "sender_email": recipient,
            "sender_role": "Client Lecteur / Étudiant",
            "subject_text": "Question sur la synchronisation hors-ligne de la liseuse",
            "message_body": "Bonjour, je souhaiterais savoir comment activer le mode lecture hors-ligne sur ma tablette Android pour mes cours de droit.",
            "ticket_id": "TK-8419",
        },
        recipient_name="Équipe Support LAHAThèque",
        reply_to=recipient
    )
    print(f"-> Résultat 7: Success={res7.success}, Provider={res7.provider}, ID={res7.message_id}")
    time.sleep(1)

    # 8. Réinitialisation de Mot de Passe
    print("\n[8/11] Envoi : Demande de Réinitialisation de Mot de Passe...")
    res8 = EmailService.send(
        email_type="password_reset_request",
        to_email=recipient,
        subject="Réinitialisation de votre mot de passe • LAHAThèque",
        template_name="emails/auth/password_reset.html",
        context={
            "reset_url": "https://lahatheque.com/reset-password?token=sec_token_9834710928347",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 8: Success={res8.success}, Provider={res8.provider}, ID={res8.message_id}")
    time.sleep(1)

    # 9. Code de Sécurité MFA / OTP
    print("\n[9/11] Envoi : Code d'Authentification Sécurisé OTP...")
    res9 = EmailService.send(
        email_type="otp_security_code",
        to_email=recipient,
        subject="482 915 est votre code de sécurité LAHAThèque",
        template_name="emails/auth/otp_code.html",
        context={
            "otp_code": "482 915",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 9: Success={res9.success}, Provider={res9.provider}, ID={res9.message_id}")
    time.sleep(1)

    # 10. Activation et Bienvenue Inscription
    print("\n[10/11] Envoi : Activation de Compte & Bienvenue...")
    res10 = EmailService.send(
        email_type="account_welcome_verification",
        to_email=recipient,
        subject="Bienvenue sur LAHAThèque • Confirmez votre adresse email",
        template_name="emails/auth/welcome_verification.html",
        context={
            "verification_url": "https://lahatheque.com/verify-email?token=verif_token_20268491",
        },
        recipient_name=RECIPIENT_NAME
    )
    print(f"-> Résultat 10: Success={res10.success}, Provider={res10.provider}, ID={res10.message_id}")
    time.sleep(1)

    # 11. Bordereau de Droits d'Auteur avec PDF certifié joint
    print("\n[11/11] Envoi : Bordereau Trimestriel de Droits d'Auteur avec PDF...")
    res11 = EmailService.send(
        email_type="author_royalty_statement",
        to_email=recipient,
        subject="Bordereau de Droits d'Auteur #BRD-2026-Q1 • LAHA Éditions",
        template_name="emails/royalties/author_statement.html",
        context={
            "reference": "BRD-2026-Q1",
            "period": "1er Trimestre 2026 (Janvier - Mars)",
            "royalty_rate": "15.00",
            "net_amount": "245 000",
            "currency": "FCFA",
        },
        recipient_name=RECIPIENT_NAME,
        pdf_royalty_data={
            "reference": "BRD-2026-Q1",
            "beneficiary_name": RECIPIENT_NAME,
            "beneficiary_role": "Auteur Principal • LAHA Éditions",
            "period": "1er Trimestre 2026",
            "gross_sales": 1633333,
            "royalty_rate": 15.0,
            "net_amount": 245000,
            "currency": "FCFA",
            "sales_breakdown": [
                {"title": "Traité de Droit Civil Béninois (Numérique)", "gross": 980000, "rate": 15.0, "net": 147000},
                {"title": "Pratique Judiciaire & Procédure (Papier)", "gross": 653333, "rate": 15.0, "net": 98000}
            ]
        }
    )
    print(f"-> Résultat 11: Success={res11.success}, Provider={res11.provider}, ID={res11.message_id}")

print("\n=== FIN DE LA CAMPAGNE DE TEST D'ENVOIS ===")
