from rest_framework.views import APIView
from rest_framework.response import Response

class AnalyzeBookAIView(APIView):
    def post(self, request, book_id):
        # TODO: Lancer analyser_ouvrage_task.delay(book_id)
        return Response({"status": "task_queued"})
