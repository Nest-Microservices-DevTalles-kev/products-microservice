import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(private readonly db: PrismaService) {}

  create(createProductDto: CreateProductDto) {
    return this.db.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalCount = await this.db.product.count({
      where: {
        available: true,
      },
    });
    const lasPage = Math.ceil(totalCount / limit);

    return {
      data: await this.db.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      metadata: {
        page,
        total: totalCount,
        limit,
        lasPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.db.product.findUnique({
      where: {
        id,
        available: true,
      },
    });

    if (!product || product.available === false) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Product with id #${id} not found`,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    console.log(updateProductDto);
    console.log(id);
    const { id: _, ...data } = updateProductDto;
    await this.findOne(id);

    return await this.db.product.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: number) {
    //   try {
    //     return await this.db.product.delete({
    //       where: {
    //         id,
    //       },
    //     });
    //   } catch (error) {
    //     this.logger.error(error);
    //     throw new NotFoundException(`Product #${id} not found`);
    //   }
    // }

    // Soft Delete
    try {
      await this.findOne(id);
      return await this.db.product.update({
        where: {
          id,
        },
        data: {
          available: false,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw new NotFoundException(`Product #${id} not found`);
    }
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.db.product.findMany({
      where: {
        id: {
          in: ids,
        },
        available: true,
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Products with ids ${ids.toString()} not found`,
      });
    }

    return products;
  }
}
