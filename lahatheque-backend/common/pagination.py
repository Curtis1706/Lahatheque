from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 10000

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('all') in ('true', '1', 'True') or request.query_params.get('page_size') in ('all', '-1'):
            return None
        return super().paginate_queryset(queryset, request, view=view)
