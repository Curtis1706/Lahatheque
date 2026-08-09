from rest_framework import serializers
from .models import AudioTrack

class AudioTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioTrack
        fields = '__all__'
