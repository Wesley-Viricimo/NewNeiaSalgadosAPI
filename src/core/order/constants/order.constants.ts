export const PAYMENT_METHOD = {
    0: "DINHEIRO",
    1: "PIX",
    2: "CARTÃO DE CRÉDITO"
}

export const TYPE_OF_DELIVERY = {
    0: "ENTREGA",
    1: "RETIRA"
}

export const ORDER_STATUS_DELIVERY = {
    0: "PENDENTE",
    1: "RECEBIDO",
    2: "PREPARANDO",
    3: "SAIU PARA ENTREGA",
    4: "ENTREGUE",
    5: "CANCELADO"
}

export const ORDER_STATUS_WITHDRAWAL = {
    0: "PENDENTE",
    1: "RECEBIDO",
    2: "PREPARANDO",
    3: "PRONTO PARA RETIRADA",
    4: "ENTREGUE",
    5: "CANCELADO"
}

export const ORDER_PLACED ={
    title: "Pedido realizado",
    body: "Seu pedido foi realizado com sucesso. Em breve enviaremos notificações atualizando o status de seu pedido"
}

export const ORDER_PENDING = {
    title: "Pedido pendente",
    body: "Seu pedido foi realizado com sucesso. Em breve enviaremos notificações atualizando o status de seu pedido"
}

export const ORDER_RECEIVED = {
    title: "Pedido recebido",
    body: "Seu pedido foi recebido pela loja e em breve começará a ser preparado"
}

export const PREPARING_ORDER = {
    title: "Pedido sendo preparado",
    body: "Boa notícia, seu pedido está sendo preparado"
}

export const ORDER_READY_FOR_DELIVERY = {
    title: "Pedido em rota de entrega",
    body: "Boa notícia, seu pedido saiu para entrega"
}

export const ORDER_READY_FOR_WITHDRAWAL = {
    title: "Pedido pronto para retirada",
    body: "Boa notícia, seu pedido está pronto para retirada"
}

export const ORDER_DELIVERED = {
    title: "Pedido entregue",
    body: "Seu pedido foi entregue, obrigado pela preferência e volte sempre"
}

export const ORDER_CANCELED = {
    title: "Pedido cancelado",
    body: "Houve algum problema e seu pedido foi cancelado"
}