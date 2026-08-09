from rest_framework import serializers
from .models import Ouvrage, BookAuthor, Discipline, MetadataONIX

class BookAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookAuthor
        fields = '__all__'

class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = '__all__'

class OuvrageSerializer(serializers.ModelSerializer):
    authors_details = BookAuthorSerializer(source='authors', many=True, read_only=True)
    discipline_detail = DisciplineSerializer(source='discipline', read_only=True)
    publisher_name = serializers.CharField(source='publisher.name', read_only=True, default='')
    institution_name = serializers.CharField(source='institution.name', read_only=True, default='')

    class Meta:
        model = Ouvrage
        fields = '__all__'

class MetadataONIXSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataONIX
        fields = '__all__'

