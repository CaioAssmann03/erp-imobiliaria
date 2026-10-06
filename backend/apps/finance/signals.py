from django.db.models import Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Transaction


@receiver(post_save, sender=Transaction)
@receiver(post_delete, sender=Transaction)
def update_(sender, instance, **kwargs):
    # A 'instance' é o lançamento que acabou de ser salvo ou deletado.
    # A partir dela, pegamos a Conta Corrente vinculada.
    current_account = instance.account

    # Recalcula a soma de todos os lançamentos vinculados a esta conta
    result = Transaction.objects.filter(account=current_account).aggregate(
        total=Sum("amount")  # Assume que 'amount' guarda valores positivos e negativos
    )

    # Se não houver lançamentos, o total é 0
    novo_saldo = result["total"] or 0

    # Atualiza o saldo na Conta Corrente e salva
    current_account.current_balance = novo_saldo
    current_account.save()
