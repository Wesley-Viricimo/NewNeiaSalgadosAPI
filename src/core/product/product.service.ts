import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { ProductSide } from './entities/product.entity';
import { PrismaService } from 'src/shared/prisma/prisma.service';


@Injectable()
export class ProductService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async create(createProductDto: CreateProductDto, file: Express.Multer.File) {
    if (!createProductDto.description) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `A ${ProductSide['description']} é obrigatória!`);
    }

    if(!createProductDto.price) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${ProductSide['price']} é obrigatório!`);
    }

    if(file) {
      if(!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg')) {
        throw new ErrorExceptionFilters('UNSUPPORTED_MEDIA_TYPE', `A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);
      }
    }

    const existsProduct = await this.prismaService.product.findUnique({
      where: { description: createProductDto.description }
    });

    if(existsProduct) {
      const message = { severity: 'error', summary: 'Erro', detail: 'Produto já cadastrado!' };
      return {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      }
    }
    
    return await this.prismaService.product.create({
      data: {
        description: createProductDto.description,
        price: Number(createProductDto.price),
        urlImage: file? file.originalname : ''
      }
    })
    .then(result => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto cadastrado com sucesso!' };
      return {
        data: result,
        message,
        statusCode: HttpStatus.CREATED
      };
    })
    .catch((err) => {
      console.log(err);
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao cadastrar produto!' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
    });
  }

  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
