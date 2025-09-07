import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { productSelectConfig } from "./config/product-select-config";
import { ProductDto, ProductQuery } from "./dto/product.dto";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { Prisma, Product } from "@prisma/client";

@Injectable()
export class ProductRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createProduct(productDto: ProductDto, urlImage: string | null) {
        return await this.prismaService.product.create({
            select: productSelectConfig,
            data: {
                title: productDto.title,
                description: productDto.description,
                price: productDto.price,
                idCategory: productDto.idCategory,
                urlImage
            }
        })
    }

    async updateProduct(idProduct: number, productDto: ProductDto, urlImage: string | null) {
        return await this.prismaService.product.update({
            where: { idProduct: idProduct },
            data: {
                idProduct: idProduct,
                idCategory: productDto.idCategory,
                description: productDto.description,
                price: productDto.price,
                urlImage: urlImage
            }
        })
    }

    async deleteProduct(idProduct: number) {
        return await this.prismaService.product.delete({
            where: { idProduct }
        });
    }

    async findAllProductsPaginated(productQuery: ProductQuery, where: Prisma.ProductWhereInput) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: productQuery.page, perPage: productQuery.perPage });

        return await paginate<Product, Prisma.ProductFindManyArgs>(
            this.prismaService.product,
            {
                where,
                select: productSelectConfig
            }
        )
    }

    async findProductById(idProduct: number) {
        return await this.prismaService.product.findUnique({
            where: { idProduct }
        });
    }

    async findProductsByCategory(idCategory: number) {
        return await this.prismaService.product.findMany({
        where: { idCategory }
      });
    }

    async findProductByTitle(title: string) {
        return await this.prismaService.product.findUnique({
            where: { title }
        });
    }

    async findProductCategory(idCategory: number) {
        return await this.prismaService.category.findUnique({
            where: { idCategory }
        });
    }
}