from celery import shared_task

@shared_task
def analyser_ouvrage_task(ouvrage_id):
    """Tâche asynchrone d'analyse de texte complet d'un ouvrage."""
    # TODO: Extraire texte PyMuPDF puis appeler AIProvider
    pass
