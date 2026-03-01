import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsBoolean()
  @IsOptional()
  isExcluded?: boolean;

  @IsIn(['debit', 'credit'])
  @IsOptional()
  type?: 'debit' | 'credit';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ValidateIf((o: UpdateTransactionDto) => o.myShare != null)
  @IsNumber()
  @Min(0.01, { message: 'My share must be greater than 0' })
  @IsOptional()
  @Type(() => Number)
  myShare?: number | null;
}
