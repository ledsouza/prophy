from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
from .models import PotencialCliente
from .serializers import CNPJSerializer


class LatestPotencialClienteStatusView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data['cnpj']

            try:
                latest_client = PotencialCliente.objects.filter(
                    cnpj=cnpj
                ).latest('data_proposta')
                return Response({'approved': latest_client.approved_client()}, status=status.HTTP_200_OK)

            except PotencialCliente.DoesNotExist:
                return Response({'error': 'Nenhum cliente foi encontrado com esse cnpj'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
