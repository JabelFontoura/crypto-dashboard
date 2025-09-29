import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

interface HourlyAverageAttributes {
  id: number;
  symbol: string;
  averagePrice: number;
  hour: string;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HourlyAverageCreationAttributes
  extends Optional<HourlyAverageAttributes, 'id'> {}

@Table({
  tableName: 'hourly_averages',
  indexes: [
    { fields: ['symbol'] },
    { fields: ['hour'] },
    { fields: ['symbol', 'hour'], unique: true },
  ],
})
export class HourlyAverage
  extends Model<HourlyAverageAttributes, HourlyAverageCreationAttributes>
  implements HourlyAverageAttributes
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id!: number;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  public symbol!: string;

  @AllowNull(false)
  @Column({
    type: DataType.DOUBLE,
    validate: {
      isFloat: true,
      min: 0,
    },
  })
  public averagePrice!: number;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: true,
    },
  })
  public hour!: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      isInt: true,
      min: 0,
    },
  })
  public count!: number;

  @CreatedAt
  public readonly createdAt!: Date;

  @UpdatedAt
  public readonly updatedAt!: Date;

  // Domain logic methods
  public getHourDate(): Date {
    return new Date(this.hour);
  }

  public isForCurrentHour(): boolean {
    const now = new Date();
    const hourDate = this.getHourDate();

    return (
      now.getFullYear() === hourDate.getFullYear() &&
      now.getMonth() === hourDate.getMonth() &&
      now.getDate() === hourDate.getDate() &&
      now.getHours() === hourDate.getHours()
    );
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      symbol: this.symbol,
      averagePrice: this.averagePrice,
      hour: this.hour,
      count: this.count,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Static factory methods for creating instances without database interaction
  public static createInstance(
    symbol: string,
    averagePrice: number,
    hour: string,
    count: number
  ): HourlyAverage {
    // Validate inputs
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      throw new Error('Symbol must be a non-empty string');
    }
    if (
      typeof averagePrice !== 'number' ||
      averagePrice < 0 ||
      !isFinite(averagePrice)
    ) {
      throw new Error('Average price must be a positive finite number');
    }
    if (!hour || typeof hour !== 'string') {
      throw new Error('Hour must be a valid ISO string');
    }
    const date = new Date(hour);
    if (isNaN(date.getTime())) {
      throw new Error('Hour must be a valid ISO date string');
    }
    if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
      throw new Error('Count must be a non-negative integer');
    }

    const instance = new HourlyAverage();
    instance.symbol = symbol;
    instance.averagePrice = averagePrice;
    instance.hour = hour;
    instance.count = count;
    return instance;
  }

  public static fromJSON(data: any): HourlyAverage {
    return HourlyAverage.createInstance(
      data.symbol,
      data.averagePrice,
      data.hour,
      data.count
    );
  }
}
