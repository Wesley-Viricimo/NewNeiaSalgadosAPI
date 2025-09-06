import { PrismaService } from "src/shared/prisma/prisma.service";
import { AddressDto, AddressQuery } from "./dto/address.dto";
import { addressByIdSelectConfig, addressSelectConfig, userSelectConfig } from "./config/address-select-config";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { Address, Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AddressRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createAddress(addressDto: AddressDto, userId: number) {
        return await this.prismaService.address.create({
            data: {
                cep: addressDto.cep,
                state: addressDto.state,
                city: addressDto.city,
                district: addressDto.district,
                road: addressDto.road,
                number: addressDto.number,
                complement: addressDto.complement,
                user: {
                    connect: {
                        idUser: userId
                    }
                }
            },
            include: {
                user: userSelectConfig
            }
        })
    }

    async updateAddress(id: number, addressDto: AddressDto) {
        return await this.prismaService.address.update({
            where: { idAddress: id },
            data: {
                cep: addressDto.cep,
                state: addressDto.state,
                city: addressDto.city,
                district: addressDto.district,
                road: addressDto.road,
                number: addressDto.number,
                complement: addressDto.complement,
            },
            include: {
                user: userSelectConfig
            }
        })
    }

    async deleteAddress(addressId: number) {
        return await this.prismaService.address.delete({
            where: { idAddress: addressId }
        })
    }

    async getAddressesByUserId(userId: number, addressQuery: AddressQuery) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: addressQuery.page, perPage: addressQuery.perPage });

        return await paginate<Address, Prisma.AddressFindManyArgs>(
            this.prismaService.address,
            {
                where: { idUser: userId },
                select: addressSelectConfig
            },
            { page: addressQuery.page, perPage: addressQuery.perPage }
        )
    }

    async getAddressByUser(addressDto: AddressDto, userId: number) {
        return await this.prismaService.address.findFirst({
            where: {
                idUser: userId,
                cep: addressDto.cep,
                state: addressDto.state,
                district: addressDto.district,
                road: addressDto.road,
                number: addressDto.number
            }
        });
    }

    async findAddressById(addressId: number) {
        return await this.prismaService.address.findUnique({
            where: { idAddress: addressId },
            select: addressByIdSelectConfig
        });
    }
}
