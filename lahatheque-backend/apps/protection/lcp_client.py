"""Client HTTP pour communiquer avec le serveur externe edrlab/lcp-server."""
import requests
from django.conf import settings

class LCPClient:
    def __init__(self):
        self.base_url = settings.LCP_SERVER_URL

    def generate_license(self, user_id, book_id):
        # TODO: Requête POST vers /licenses sur le serveur LCP
        return {"license_id": "stub_lcp_license_id"}

    def get_content_key(self, license_id):
        # TODO: Requête GET vers /licenses/{id}/content-key
        return {"content_key": "stub_key"}

    def get_status_document(self, license_id):
        # TODO: License Status Document (LSD)
        return {"status": "ready"}

    def renew_license(self, license_id, end_date):
        # TODO: Prolongation
        return {"status": "renewed"}

    def return_license(self, license_id):
        # TODO: Early return
        return {"status": "returned"}
