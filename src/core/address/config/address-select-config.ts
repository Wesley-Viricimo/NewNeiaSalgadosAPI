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

export const addressByIdSelectConfig = {
    idAddress: true,
    idUser: true,
    user: userSelectConfig,
    cep: true,
    state: true,
    city: true,
    district: true,
    road: true,
    number: true,
    complement: true
  };

export const addressSelectConfig = {
    idAddress: true,
    user: userSelectConfig,
    cep: true,
    state: true,
    city: true,
    district: true,
    road: true,
    number: true,
    complement: true
  };