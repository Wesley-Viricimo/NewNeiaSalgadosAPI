export class Address {
    idAddress: number
    cep: string
    state: string
    city: string
    district: string
    road: string
    number: string
    complement: string
    idUser: number
    createdAt: Date
    updatedAt: Date
}

export const AddressSide = {
    cep: "CEP",
    state: "estado",
    city: "cidade",
    district: "bairro",
    road: "rua",
    number: "numero",
    user: "usuário"
}