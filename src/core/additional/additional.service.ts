import { Injectable } from '@nestjs/common';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';

@Injectable()
export class AdditionalService {
  create(createAdditionalDto: CreateAdditionalDto) {
    return 'This action adds a new additional';
  }

  findAll() {
    return `This action returns all additional`;
  }

  findOne(id: number) {
    return `This action returns a #${id} additional`;
  }

  update(id: number, updateAdditionalDto: UpdateAdditionalDto) {
    return `This action updates a #${id} additional`;
  }

  remove(id: number) {
    return `This action removes a #${id} additional`;
  }
}
