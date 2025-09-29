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

interface CryptoPairAttributes {
  id: number;
  symbol: string;
  price: number;
  timestamp: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CryptoPairCreationAttributes
  extends Optional<CryptoPairAttributes, 'id'> {}

@Table({
  tableName: 'crypto_pairs',
  indexes: [
    { fields: ['symbol'] },
    { fields: ['timestamp'] },
    { fields: ['symbol', 'timestamp'] },
  ],
})
export class CryptoPair
  extends Model<CryptoPairAttributes, CryptoPairCreationAttributes>
  implements CryptoPairAttributes
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
  public price!: number;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.BIGINT,
    validate: {
      isInt: true,
      min: 0,
    },
  })
  public timestamp!: number;

  @CreatedAt
  public readonly createdAt!: Date;

  @UpdatedAt
  public readonly updatedAt!: Date;

  // Domain logic methods
  public isRecent(maxAgeMs: number = 300000): boolean {
    // 5 minutes default
    return Date.now() - this.timestamp <= maxAgeMs;
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      symbol: this.symbol,
      price: this.price,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Static factory methods for creating instances without database interaction
  public static createInstance(
    symbol: string,
    price: number,
    timestamp: number
  ): CryptoPair {
    // Validate inputs
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      throw new Error('Symbol must be a non-empty string');
    }
    if (typeof price !== 'number' || price < 0 || !isFinite(price)) {
      throw new Error('Price must be a positive finite number');
    }
    if (
      typeof timestamp !== 'number' ||
      timestamp <= 0 ||
      !isFinite(timestamp)
    ) {
      throw new Error('Timestamp must be a positive finite number');
    }

    const instance = new CryptoPair();
    instance.symbol = symbol;
    instance.price = price;
    instance.timestamp = timestamp;
    return instance;
  }

  public static fromJSON(data: any): CryptoPair {
    return CryptoPair.createInstance(data.symbol, data.price, data.timestamp);
  }
}
