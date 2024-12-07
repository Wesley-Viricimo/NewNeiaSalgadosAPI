import { Test, TestingModule } from '@nestjs/testing';
import { AdditionalService } from './additional.service';

describe('AdditionalService', () => {
  let service: AdditionalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdditionalService],
    }).compile();

    service = module.get<AdditionalService>(AdditionalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
