import { registerAs } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { CryptoPair } from '../../modules/crypto/models/crypto-pair.model';
import { HourlyAverage } from '../../modules/crypto/models/hourly-average.model';

export default registerAs(
  'database',
  (): SequelizeModuleOptions => ({
    dialect: 'sqlite',
    storage:
      process.env.NODE_ENV === 'production'
        ? './data/crypto-dashboard.db'
        : ':memory:',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    models: [CryptoPair, HourlyAverage],
    autoLoadModels: true,
    synchronize: true,
  })
);
