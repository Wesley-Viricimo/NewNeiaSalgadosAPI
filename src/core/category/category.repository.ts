import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { CategoryDto, CategoryQuery } from "./dto/category.dto";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { Category, Prisma } from "@prisma/client";

@Injectable()
export class CategoryRepository {

    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createCategory(categoryDto: CategoryDto) {
        return await this.prismaService.category.create({
            select: { idCategory: true, description: true },
            data: {
                description: categoryDto.description
            }
        })
    }

    async updateCategory(idCategory: number, categoryDto: CategoryDto) {
        return await this.prismaService.category.update({
            where: { idCategory: idCategory },
            data: {
                idCategory: idCategory,
                description: categoryDto.description
            }
        })
    }

    async deleteCategory(idCategory: number) {
        return await this.prismaService.category.delete({
            where: { idCategory: idCategory }
        })
    }

    async getCategoryById(categoryId: number) {
        return await this.prismaService.category.findUnique({
            where: { idCategory: categoryId }
        });
    }

    async getCategoriesNotPaginated(categoryQuery: CategoryQuery) {
        return await this.prismaService.category.findMany({
            where: {
                description: {
                    contains: categoryQuery.description,
                    mode: 'insensitive'
                }
            },
            select: {
                idCategory: true,
                description: true
            }
        });
    }

    async getCategoriesPaginated(categoryQuery: CategoryQuery) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: categoryQuery.page, perPage: categoryQuery.perPage });

        return await paginate<Category, Prisma.CategoryFindManyArgs>(
            this.prismaService.category,
            {
                where: {
                    description: {
                        contains: categoryQuery.description,
                        mode: 'insensitive'
                    }
                },
                select: {
                    idCategory: true,
                    description: true
                }
            }
        )
    }

    async getCategoryByDescription(description: string) {
        return await this.prismaService.category.findFirst({
            where: {
                description: {
                    equals: description,
                    mode: 'insensitive'
                },
            },
        });
    }
}