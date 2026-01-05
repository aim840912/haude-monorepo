import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmTourDto } from './create-farm-tour.dto';

export class UpdateFarmTourDto extends PartialType(CreateFarmTourDto) {}
