# Generated by Django 5.0.8 on 2024-10-05 12:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('autenticacao', '0007_alter_useraccount_cpf'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='is_active',
            field=models.BooleanField(default=True, help_text='Indica que o usuário será tratado como ativo. Ao invés de excluir contas de usuário, desmarque isso.', verbose_name='Conta Ativa'),
        ),
        migrations.AlterField(
            model_name='useraccount',
            name='is_staff',
            field=models.BooleanField(default=False, help_text='Indica que usuário consegue acessar este site de administração.', verbose_name='Acesso à Administração'),
        ),
        migrations.AlterField(
            model_name='useraccount',
            name='is_superuser',
            field=models.BooleanField(default=False, help_text='Indica que este usuário tem todas as permissões sem atribuí-las explicitamente.', verbose_name='Superusuário'),
        ),
    ]
