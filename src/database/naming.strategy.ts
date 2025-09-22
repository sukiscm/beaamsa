import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  tableName(targetName: string, userSpecifiedName?: string) { return userSpecifiedName ?? snakeCase(targetName); }
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]) {
    return snakeCase(embeddedPrefixes.join('_')) + (customName ?? snakeCase(propertyName));
  }
  relationName(propertyName: string) { return snakeCase(propertyName); }
  joinColumnName(relationName: string, referencedColumnName: string) { return snakeCase(`${relationName}_${referencedColumnName}`); }
}
