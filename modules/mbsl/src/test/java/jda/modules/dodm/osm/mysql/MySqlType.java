package jda.modules.dodm.osm.mysql;

import java.sql.Types;

import jda.modules.dcsl.syntax.DAttr.Type;
import jda.modules.dodm.osm.relational.DataSourceType;

/**
 * Minimal MySQL type mapping used by the CourseMan test configurations.
 */
public enum MySqlType implements DataSourceType {
  VarChar("varchar(%s)", Type.String, Types.VARCHAR),
  VarCharMasked("varchar(%s)", Type.StringMasked, Types.VARCHAR),
  VarCharBool("varchar(%s)", Type.Boolean, Types.VARCHAR),
  Char("char(%s)", Type.Char, Types.CHAR),
  SmallInt("smallint", Type.Short, Types.SMALLINT),
  Int("int", Type.Integer, Types.INTEGER),
  Long("bigint", Type.Long, Types.BIGINT),
  BigInt("bigint", Type.BigInteger, Types.BIGINT),
  Real("real", Type.Float, Types.REAL),
  Double("double", Type.Double, Types.DOUBLE),
  Date("date", Type.Date, Types.DATE),
  Byte("bit(%s)", Type.Byte, Types.BIT),
  ByteArraySmall("varbinary(%s)", Type.ByteArraySmall, Types.VARBINARY),
  ByteArrayLarge("longblob", Type.ByteArrayLarge, Types.LONGVARBINARY),
  ByteArrayImage("longblob", Type.Image, Types.LONGVARBINARY),
  FileType("longblob", Type.File, Types.LONGVARBINARY);

  private final String name;
  private final Type javaType;
  private final int intValue;

  MySqlType(String name, Type javaType, int intValue) {
    this.name = name;
    this.javaType = javaType;
    this.intValue = intValue;
  }

  @Override
  public Type getMapping() {
    return javaType;
  }

  @Override
  public String toString(Object... args) {
    return String.format(name, args);
  }

  @Override
  public int getIntValue() {
    return intValue;
  }

  @Override
  public boolean isSizableFor(int size) {
    return true;
  }
}
