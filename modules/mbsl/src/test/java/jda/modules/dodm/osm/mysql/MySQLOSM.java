package jda.modules.dodm.osm.mysql;

import jda.modules.common.exceptions.DataSourceException;
import jda.modules.dodm.dom.DOMBasic;
import jda.modules.dodm.osm.relational.DataSourceType;
import jda.modules.dodm.osm.relational.RelationalOSMBasic;
import jda.modules.dodm.osm.relational.sql.function.DataSourceFunction;
import jda.modules.mccl.conceptmodel.dodm.OsmConfig;

/**
 * Minimal MySQL OSM adapter for the CourseMan test configurations.
 */
public class MySQLOSM extends RelationalOSMBasic {
  public MySQLOSM(OsmConfig config, DOMBasic dom) throws DataSourceException {
    super(config, dom);
  }

  @Override
  protected Class<? extends DataSourceType> getDataSourceTypeClass() {
    return MySqlType.class;
  }

  @Override
  protected Class<? extends DataSourceFunction> getDataSourceFunctionClass() {
    return MySqlFunction.class;
  }

  @Override
  protected String getQuerySchemaExist(String schemaName) {
    return String.format(
        "select schema_name from information_schema.schemata where schema_name = '%s'",
        schemaName);
  }

  @Override
  protected String getQueryRelationNames(String schemaName) {
    return String.format(
        "select table_name from information_schema.tables where table_schema = '%s'",
        schemaName);
  }

  @Override
  protected String getQueryDropTable(String tableName) {
    return String.format("drop table %s", tableName);
  }

  @Override
  public String getDefaultSchema() {
    return null;
  }

  @Override
  public String getDataSourceSchema(String dsName) {
    return dsName;
  }
}
