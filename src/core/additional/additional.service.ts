import { CreateAdditionalProductDto } from './dto/create-additional-product.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AdditionalService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
  ) { }

  async create(createAdditionalDto: CreateAdditionalDto) {

    await this.validateFieldsCreateAdditional(createAdditionalDto);

    return await this.prismaService.additional.create({
      data: {
        description: createAdditionalDto.description,
        price: createAdditionalDto.price
      }
    })
      .then(result => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicional cadastrado com sucesso!' };
        return {
          data: result,
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar adicional!');
      });
  }

  async validateFieldsCreateAdditional(createAdditionalDto: CreateAdditionalDto) {
    if (isNaN(Number(createAdditionalDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do adicional deve ser um valor numérico!`);

    const existsAdditional = await this.prismaService.additional.findFirst({
      where: { description: createAdditionalDto.description }
    });

    if (existsAdditional) this.exceptionHandler.errorBadRequestResponse('Adicional já cadastrado no sistema!');
  }

  async findAdditionalByProduct(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    });

    if (!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');

    const additionalsProduct = await this.prismaService.productAdditional.findMany({
      where: { idProduct: id }
    });

    const data = [];

    try {
      for (const additionalProduct of additionalsProduct) {
        const additional = await this.prismaService.additional.findUnique({
          where: { idAdditional: additionalProduct.idAdditional }
        });

        if (additional) {
          data.push({
            idAdditional: additional.idAdditional,
            description: additional.description,
            price: additional.price
          });
        }
      }

      const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicionais listados com sucesso.' };
      return {
        data,
        message,
        statusCode: HttpStatus.OK
      };

    } catch (error) {
      this.exceptionHandler.errorBadRequestResponse('Erro ao listar adicionais!');
    }
  }

  async createAdditionalProduct(createAdditionalProductDto: CreateAdditionalProductDto) {
    await this.validateFieldsCreateAdditionalProduct(createAdditionalProductDto);
  
    const additionalData = createAdditionalProductDto.idAdditional.map(idAdditional => ({
      idProduct: createAdditionalProductDto.idProduct,
      idAdditional: idAdditional,
    }));
  
    try {
      await this.prismaService.productAdditional.createMany({
        data: additionalData,
      });
  
      const productWithAdditionals = await this.prismaService.product.findUnique({
        where: { idProduct: createAdditionalProductDto.idProduct },
        include: {
          productAdditional: {
            include: {
              additional: true, 
            },
          },
        },
      });
  
      if (!productWithAdditionals) {
        throw new Error('Produto não encontrado.');
      }
  
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicional vinculado ao produto com sucesso!' };

      const response = {
        data: {
          idProduct: productWithAdditionals.idProduct,
          titleProduct: productWithAdditionals.title,
          additionals: productWithAdditionals.productAdditional.map(pa => ({
            idAdditional: pa.additional.idAdditional,
            description: pa.additional.description,
            price: pa.additional.price,
          })),
        },
        message,
        statusCode: HttpStatus.CREATED,
      };
  
      return response;
  
    } catch (error) {
      this.exceptionHandler.errorBadRequestResponse('Erro ao vincular adicional ao produto!');
    }
  }  

  async validateFieldsCreateAdditionalProduct(createAdditionalProductDto: CreateAdditionalProductDto) {
    const product = await this.prismaService.product.findUnique({
      where: { idProduct: createAdditionalProductDto.idProduct }
    });

    if (!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');

    for(const add of createAdditionalProductDto.idAdditional) {
      const additional = await this.prismaService.additional.findUnique({
        where: { idAdditional: add }
      });

      if (!additional) this.exceptionHandler.errorNotFoundResponse('Este adicional não está cadastrado no sistema!');
    }
    
  }

  update(id: number, updateAdditionalDto: UpdateAdditionalDto) {
    return `This action updates a #${id} additional`;
  }

  remove(id: number) {
    return `This action removes a #${id} additional`;
  }
}
