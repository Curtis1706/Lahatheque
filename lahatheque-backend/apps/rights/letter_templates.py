"""
Modèles textuels types par défaut pour les courriers officiels LAHAThèque.
Conformes à la spécification specs/008-courrier-redevances-relances/templates-courriers.md
Règles :
- Devise officielle stricte : FCFA
- Zéro émoji
- Pas de mention de consultations pour les auteurs (uniquement le volume de ventes)
- Pas de bloc de signature redondant en fin de texte (s'arrête à la formule de politesse, le pied de page du gabarit faisant foi)
"""
from typing import Dict, Any


def get_default_letter_template(
    category: str,
    context: Dict[str, Any]
) -> Dict[str, str]:
    """
    Retourne l'objet et le corps de texte type pré-rempli pour une catégorie et un contexte donnés.
    """
    nom_destinataire = context.get("recipient_name", "Cher Partenaire")
    periode = context.get("period", "Période en cours")
    volume_ventes = str(context.get("volume_ventes", "0"))
    assiette_brute = f"{float(context.get('assiette_brute', 0.0)):,.0f}".replace(",", " ")
    montant_net = f"{float(context.get('montant_net', 0.0)):,.0f}".replace(",", " ")
    taux = str(context.get("taux", "15"))
    ref_contrat = context.get("reference_contrat", "Accord Cadre LAHAThèque")
    ref_dette = context.get("reference_dette", "REC-2026-001")
    ref_facture = context.get("reference_facture", "FACT-2026-001")
    date_echeance = context.get("date_echeance", "Échéance contractuelle")
    nombre_relances = str(context.get("nombre_relances", 1))

    if category == "royalty_author":
        subject = f"Bordereau officiel des droits d'auteur et relevé de ventes — {periode}"
        body = (
            f"Cher(e) {nom_destinataire},\n\n"
            f"Nous avons le plaisir de vous transmettre votre bordereau officiel de décompte de droits d'auteur pour la période : {periode}.\n\n"
            "Conformément aux stipulations de votre contrat d'édition conclu avec LAHA Éditions, vous trouverez ci-après la synthèse des ventes de vos œuvres sur la plateforme LAHAThèque :\n\n"
            f"• Nombre d'exemplaires vendus : {volume_ventes}\n"
            f"• Assiette brute des ventes générées : {assiette_brute} FCFA\n"
            f"• Montant net des droits d'auteur vous revenant : {montant_net} FCFA\n\n"
            "Le document officiel scellé reprenant le détail livre par livre est joint au présent message au format PDF.\n\n"
            "Si vous souhaitez déclencher le versement de vos droits disponibles, vous pouvez vous connecter directement à votre espace auteur sur la plateforme ou répondre à ce message en nous communiquant votre Relevé d'Identité Bancaire (RIB) ou votre numéro de compte Mobile Money certifié.\n\n"
            "Nous vous remercions pour votre précieuse collaboration et votre confiance continue dans la diffusion du savoir africain.\n\n"
            f"Veuillez agréer, Cher(e) {nom_destinataire}, l'assurance de notre considération distinguée."
        )

    elif category == "royalty_university":
        subject = f"Bordereau officiel de redevances institutionnelles conventionnées (15%) — {periode}"
        body = (
            f"À l'attention de Monsieur le Recteur / Madame la Directrice,\n"
            f"Agence Comptable et Direction de la Coopération Universitaire\n"
            f"{nom_destinataire}\n\n"
            f"Réf. Convention-Cadre : {ref_contrat}\n"
            f"Période comptable : {periode}\n\n"
            "Monsieur le Recteur, Madame la Directrice,\n\n"
            f"En application de la Convention-Cadre de partenariat conclue entre votre illustre Établissement et LAHA Éditions, nous avons l'honneur de vous transmettre le bordereau officiel de redevances universitaires arrêté pour la période : {periode}.\n\n"
            "Conformément au barème conventionné (taux fixe institutionnel de 15% sur les acquisitions et abonnements réalisés au sein de votre établissement), les données consolidées s'établissent comme suit :\n\n"
            f"• Volume global des acquisitions enregistrées : {volume_ventes}\n"
            f"• Assiette brute de référence : {assiette_brute} FCFA\n"
            f"• Redevance conventionnelle due (15%) : {montant_net} FCFA\n\n"
            "Le bordereau financier officiel, portant visa certifié et récapitulatif détaillé, est annexé au présent courrier au format PDF.\n\n"
            "Ce montant est à votre disposition et fera l'objet d'un virement sur le compte bancaire officiel de votre Établissement dès réception de votre avis de confirmation.\n\n"
            "Nous vous prions d'agréer, Monsieur le Recteur, Madame la Directrice, l'expression de notre haute et respectueuse considération."
        )

    elif category == "royalty_publisher":
        subject = f"Relevé officiel des redevances de diffusion et co-édition — {periode}"
        body = (
            f"À l'attention de la Direction Générale,\n"
            f"{nom_destinataire}\n\n"
            f"Réf. Partenariat Commercial : {ref_contrat}\n"
            f"Période : {periode}\n\n"
            "Chers Confrères,\n\n"
            f"Nous avons le plaisir de vous faire parvenir le décompte contractuel officiel des ventes et diffusions de votre catalogue sur la plateforme LAHAThèque pour la période : {periode}.\n\n"
            "Suivant les stipulations particulières de notre accord de co-édition et distribution, le décompte des ventes pour votre maison d'édition se présente ainsi :\n\n"
            f"• Taux contractuel négocié appliqué : {taux}%\n"
            f"• Ventes brutes enregistrées sur la période : {assiette_brute} FCFA\n"
            f"• Montant net des redevances revenant à votre maison : {montant_net} FCFA\n\n"
            "Le bordereau de décompte officiel scellé, présentant la ventilation exacte titre par titre et le détail des transactions certifiées, est joint au présent courriel en pièce jointe PDF.\n\n"
            "Nous vous invitons à nous adresser votre facture correspondante afin que le règlement puisse être effectué par virement bancaire dans les meilleurs délais.\n\n"
            "Dans l'attente de la poursuite fructueuse de notre coopération éditoriale, nous vous prions d'agréer, Chers Confrères, nos salutations les plus cordiales."
        )

    elif category == "debt_reminder":
        subject = f"Rappel d'échéance et relance officielle pour facture en impayé — Dossier {ref_dette}"
        body = (
            f"À l'attention de : {nom_destinataire}\n\n"
            f"Réf. Dossier : {ref_dette}\n"
            f"Date d'exigibilité initiale : {date_echeance}\n\n"
            "Madame, Monsieur,\n\n"
            "Sauf erreur ou omission de notre part, l'examen de nos écritures comptables fait apparaître que le règlement de la créance visée en référence demeure en souffrance à ce jour.\n\n"
            "Le détail de la créance échue est récapitulé ci-après :\n\n"
            f"• Référence de la commande / facture : {ref_facture}\n"
            f"• Montant principal exigible : {montant_net} FCFA\n"
            f"• Nombre de relances administratives déjà émises : {nombre_relances}\n\n"
            "Nous vous prions de trouver en pièce jointe au présent courriel le courrier officiel de relance, dûment scellé sur papier à en-tête institutionnel de LAHA Éditions.\n\n"
            "Nous vous invitons à régulariser cette situation dans un délai de huit (08) jours ouvrés à compter de la réception du présent message, par virement bancaire sur le compte officiel de LAHA Éditions ou par règlement direct auprès de notre agence comptable.\n\n"
            "Si votre règlement a été effectué entre-temps, nous vous saurions gré de ne pas tenir compte de ce rappel et de bien vouloir nous transmettre votre bordereau de versement pour mise à jour immédiate de votre dossier.\n\n"
            "Restant à votre entière disposition pour tout renseignement d'ordre comptable, nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées."
        )

    else:
        subject = f"Correspondance officielle — {nom_destinataire}"
        body = (
            f"À l'attention de : {nom_destinataire}\n\n"
            "Madame, Monsieur,\n\n"
            "Veuillez trouver ci-joint notre correspondance officielle certifiée par la Direction de LAHA Éditions.\n\n"
            "Nous vous prions d'agréer, Madame, Monsieur, nos salutations distinguées."
        )

    return {
        "subject": subject,
        "body": body,
    }
