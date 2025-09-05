import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AdditionalDto, AdditionalQuery } from "./dto/additional.dto";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { Additional, Prisma } from "@prisma/client";

@Injectable()
export class AdditionalRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createAdditional(additionalDto: AdditionalDto) {
        return await this.prismaService.additional.create({
            select: {
                idAdditional: true,
                description: true,
                price: true
            },
            data: {
                description: additionalDto.description,
                price: additionalDto.price
            }
        })
    }

    async updateAdditional(id: number, updateAdditionalDto: AdditionalDto) {
        return this.prismaService.additional.update({
            where: { idAdditional: id },
            data: {
                description: updateAdditionalDto.description,
                price: updateAdditionalDto.price
            }
        })
    }

    async deleteAdditional(additionalId: number) {
        return await this.prismaService.additional.delete({
            where: { idAdditional: additionalId }
        })
    }

    async findAllAdditionalNotPaginated(description: string) {
        return await this.prismaService.additional.findMany({
            where: {
                description: {
                    contains: description,
                    mode: 'insensitive'
                }
            },
            select: {
                idAdditional: true,
                description: true,
                price: true
            }
        });
    }

    async findallAdditionalPaginated(additionalQuery: AdditionalQuery) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: additionalQuery.page, perPage: additionalQuery.perPage });

        return await paginate<Additional, Prisma.AdditionalFindManyArgs>(
            this.prismaService.additional,
            {
                where: {
                    description: {
                        contains: additionalQuery.description,
                        mode: 'insensitive'
                    }
                },
                select: {
                    idAdditional: true,
                    description: true,
                    price: true
                }
            }
        ).then(response => {
            return {
                data: response.data,
                meta: response.meta
            }
        })
    }

    async getAdditionalById(additionalId: number) {
        return await this.prismaService.additional.findUnique({
            where: { idAdditional: additionalId }
        });
    }

    async getAdditionalByDescription(description: string) {
        return await this.prismaService.additional.findFirst({
            where: { description }
        });
    }
}