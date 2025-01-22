import { ORDER_CANCELED, ORDER_DELIVERED, ORDER_PENDING, ORDER_READY_FOR_DELIVERY, ORDER_READY_FOR_WITHDRAWAL, ORDER_RECEIVED, PREPARING_ORDER } from "./order.constants";

export default function getMessageStatus(orderStatus: string, typeOfDelivery: string) {
    if (typeOfDelivery == 'ENTREGA') {
        switch (orderStatus) {
            case "PENDENTE": return ORDER_PENDING;
            case "RECEBIDO": return ORDER_RECEIVED;
            case "PREPARANDO": return PREPARING_ORDER;
            case "SAIU PARA ENTREGA": return ORDER_READY_FOR_DELIVERY;
            case "ENTREGUE": return ORDER_DELIVERED;
            case "CANCELADO": return ORDER_CANCELED;  
        }
    } else {
        switch (orderStatus) {
            case "PENDENTE": return ORDER_PENDING;
            case "RECEBIDO": return ORDER_RECEIVED;
            case "PREPARANDO": return PREPARING_ORDER;
            case "PRONTO PARA RETIRADA": return ORDER_READY_FOR_WITHDRAWAL;
            case "ENTREGUE": return ORDER_DELIVERED;
            case "CANCELADO": return ORDER_CANCELED;
        }
    }
}