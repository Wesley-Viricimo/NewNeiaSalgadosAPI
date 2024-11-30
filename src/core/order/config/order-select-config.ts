export const userSelectConfig = {
    select: {
        name: true,
        surname: true,
        cpf: true,
        email: true,
        role: true,
        isActive: true,
    },
};

export const addressSelectConfig = {
    select: {
        cep: true,
        state: true,
        city: true,
        district: true,
        road: true,
        number: true,
        complement: true,
    },
};

export const orderItensSelectConfig = {
    select: {
        description: true,
        price: true,
        quantity: true
    },
};

export const orderSelectFields = { 
    idOrder: true,
    user: userSelectConfig,
    address: addressSelectConfig,
    orderItens: orderItensSelectConfig,
    typeOfDelivery: true,
    paymentMethod: true,
    orderStatus: true,
    total: true,
};

export const orderSelectByIdFields = { 
    idOrder: true,
    idUser: true,
    user: userSelectConfig,
    address: addressSelectConfig,
    orderItens: orderItensSelectConfig,
    typeOfDelivery: true,
    paymentMethod: true,
    orderStatus: true,
    total: true,
};