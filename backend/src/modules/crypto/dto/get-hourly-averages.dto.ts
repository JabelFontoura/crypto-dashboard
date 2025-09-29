import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetHourlyAveragesDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(168) // Max 1 week
  hours?: number = 24;
}

