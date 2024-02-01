import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class PrismaTestService {
  constructor(private readonly prismaService: PrismaService) {}
  findAll() {
    return this.prismaService.user.findMany();
  }

  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({ data: createUserDto });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prismaService.user.update({
      data: updateUserDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prismaService.user.delete({ where: { id } });
  }
}
