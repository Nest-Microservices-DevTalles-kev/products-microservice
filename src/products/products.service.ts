import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

    const totalPage = await this.db.product.count({
      where: {
        available: true,
      },
    });
    const lasPage = Math.ceil(totalPage / limit);

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
      throw new NotFoundException(`Product #${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}
