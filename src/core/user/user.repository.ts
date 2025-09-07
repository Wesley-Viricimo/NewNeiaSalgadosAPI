import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { UserDto, UserQuery } from "./dto/user.dto";
import { Prisma, User } from "@prisma/client";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { userSelectConfig, userTokenSelectConfig } from "./config/user-select-config";
import { ROLES } from "./constants/users.constants";

@Injectable()
export class UserRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createUser(userDto: UserDto, passwordHash: string) {
        return await this.prismaService.user.create({
            data: {
                name: userDto.name,
                surname: userDto.surname,
                cpf: userDto.cpf,
                phone: userDto.phone,
                email: userDto.email,
                password: passwordHash
            },
        })
    }

    async createAdminUser(userDto: UserDto, passwordHash: string) {
        return await this.prismaService.user.create({
            data: {
                name: userDto.name,
                surname: userDto.surname,
                cpf: userDto.cpf,
                phone: userDto.phone,
                email: userDto.email,
                role: userDto.role,
                isActive: true,
                password: passwordHash
            },
        })
    }

    async updateUser(user: User, userDto: UserDto, passwordHash?: string) {
        return await this.prismaService.user.update({
            where: { idUser: user.idUser },
            data: {
                name: userDto.name,
                surname: userDto.surname,
                cpf: userDto.cpf,
                email: userDto.email,
                password: passwordHash ? passwordHash : user.password,
            },
        })
    }

    async updateUserRole(userId: number, role: string) {
        return await this.prismaService.user.update({
            where: { idUser: userId },
            data: { role: ROLES[role] }
        })
    }

    async updateActivationCode(activationCode: string, idUser: number) {
        const activation = await this.prismaService.userActivationCode.create({
            data: {
                code: activationCode,
                idUser
            }
        });

        return await this.prismaService.userActivationCode.update({
            where: { idCode: activation.idCode },
            data: {
                confirmed: true
            }
        })
    }

    async updateUserActivity(idUser: number, userConfirmationSelectConfig: { select: { confirmed: boolean } }) {
        return await this.prismaService.user.update({
            where: { idUser },
            data: {
                isActive: true
            },
            include: {
                userActivationCode: userConfirmationSelectConfig
            }
        })
    }

    async updateUserActivationCode(idCode: number) {
        return await this.prismaService.userActivationCode.update({
            where: { idCode },
            data: { confirmed: true }
        });
    }

    async updateUserActivationCodeStatus(idUser: number, isActive: boolean) {
        return await this.prismaService.user.update({
            where: { idUser },
            data: { isActive },
            select: userSelectConfig
        })
    }

    async findAllUsersPaginated(userQuery: UserQuery, where: Prisma.UserWhereInput) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: userQuery.page, perPage: userQuery.perPage });

        return await paginate<User, Prisma.UserFindManyArgs>(
            this.prismaService.user,
            {
                where,
                select: userSelectConfig
            },
            { page: userQuery.page, perPage: userQuery.perPage }
        )

    }

    async findUserByEmail(email: string) {
        return await this.prismaService.user.findFirst({
            where: { email }
        });
    }

    async findUserByCpf(cpf: string) {
        return await this.prismaService.user.findFirst({
            where: { cpf }
        });
    }

    async findUserActivationCode(idUser: number) {
        return await this.prismaService.userActivationCode.findUnique({
            where: { idUser }
        });
    }

    async findUserById(idUser: number) {
        return await this.prismaService.user.findUnique({
            where: { idUser }
        });
    }

    async saveNotificationToken(idUser: number, notificationToken: string) {
        return await this.prismaService.userNotificationToken.upsert({
            where: { idUser }, // Busca pelo userId, para garantir que cada usuário tenha um único token
            update: {
                token: notificationToken, // Atualiza o token se já existir
            },
            create: {
                token: notificationToken, // Cria um novo token se não existir
                user: {
                    connect: {
                        idUser
                    },
                },
            },
            include: {
                user: userTokenSelectConfig
            },
        })
    }
}