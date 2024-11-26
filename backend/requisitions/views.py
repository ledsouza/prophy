from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from requisitions.serializers import ClientOperationSerializer, UnitOperationSerializer, EquipmentOperationSerializer
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


class ClientOperationViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if user.role == "Gerente Geral de Cliente":
            queryset = ClientOperation.objects.filter(
                users=user, operation_status__in=["REV", "R"])
        else:
            queryset = ClientOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = ClientOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = ClientOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class UnitOperationViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if user.role == "Gerente Geral de Cliente":
            queryset = UnitOperation.objects.filter(
                client__users=user, operation_status__in=["REV", "R"])
        else:
            queryset = UnitOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UnitOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = UnitOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class EquipmentOperationViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if user.role == "Gerente Geral de Cliente":
            queryset = EquipmentOperation.objects.filter(
                unit__client__users=user, operation_status__in=["REV", "R"])
        else:
            queryset = EquipmentOperation.objects.filter(
                operation_status__in=["REV", "R"])

        # Pagination
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = EquipmentOperationSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        else:
            serializer = EquipmentOperationSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
