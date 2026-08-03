from rest_framework import serializers
from .models import Ouvrage, BookAuthor, Discipline, MetadataONIX

class BookAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookAuthor
        fields = '__all__'

class OuvrageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ouvrage
        fields = '__all__'

class MetadataONIXSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataONIX
        fields = '__all__'
