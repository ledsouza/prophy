from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.request import Request
from .models import Proposta
from .serializers import CNPJSerializer, ClienteSerializer


class LatestPropostaStatusView(APIView):
    """
    View to check the approval status of the latest contract proposal with a given CNPJ.

    This view allows unauthenticated access.

    ## POST Request:

    **Expected Data:**

    - `cnpj`: The CNPJ of the Proposta.

    **Response:**

    - **200 OK:** If a Proposta with the given CNPJ is found.
        - Returns a JSON object containing the 'approved' key with a boolean value
          indicating whether the latest Proposta is approved or not.
    - **404 Not Found:** If no Proposta with the given CNPJ is found.
        - Returns a JSON object with an error message.
    - **400 Bad Request:** If the provided data is invalid (e.g., invalid CNPJ format).
        - Returns a JSON object containing the validation errors.
    """
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = CNPJSerializer(data=request.data)

        if serializer.is_valid():
            cnpj = serializer.validated_data['cnpj']

            try:
                latest_client = Proposta.objects.filter(
                    cnpj=cnpj
                ).latest('data_proposta')
                return Response({'approved': latest_client.approved_client()}, status=status.HTTP_200_OK)

            except Proposta.DoesNotExist:
                return Response({'error': 'Nenhum cliente foi encontrado com esse cnpj'}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateClienteView(generics.CreateAPIView):
    """
    View to create a new client. Only authenticated users can access this view.
    """
    serializer_class = ClienteSerializer

    def perform_create(self, serializer: ClienteSerializer) -> None:
        """Associate the logged in user with the new client."""
        serializer.save(user=self.request.user)
