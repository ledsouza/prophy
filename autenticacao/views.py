from django.contrib.auth.models import User

from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

from .serializers import UserSerializer


class UserView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.filter(pk=user.pk)
        return queryset
