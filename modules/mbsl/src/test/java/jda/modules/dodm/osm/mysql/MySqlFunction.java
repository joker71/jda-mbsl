package jda.modules.dodm.osm.mysql;

import jda.modules.dcsl.syntax.function.Function;
import jda.modules.dodm.osm.relational.sql.function.DataSourceFunction;

/**
 * Minimal MySQL function mapping used by the CourseMan test configurations.
 */
public enum MySqlFunction implements DataSourceFunction {
  sum("sum(%s)", Function.sum),
  avg("avg(%s)", Function.avg),
  min("min(%s)", Function.min),
  max("max(%s)", Function.max),
  date("date(%s)", Function.dsDate),
  numMillis("UNIX_TIMESTAMP(%s) * 1000", Function.numMillies),
  month("month(%s)", Function.month),
  year("year(%s)", Function.year),
  age("year(curdate()) - year(%s)", Function.age),
  dateToString("date_format(%s,'%d/%m/%Y')", Function.dateToString),
  dateToMonthOfYearString("date_format(%s,'%m/%Y')", Function.dateToMonthOfYearString),
  distinct("distinct %s", Function.distinct);

  private final String nameTemplate;
  private final Function objFunc;

  MySqlFunction(String nameTemplate, Function objFunc) {
    this.nameTemplate = nameTemplate;
    this.objFunc = objFunc;
  }

  @Override
  public Function getMapping() {
    return objFunc;
  }

  @Override
  public String toString(String var) {
    return String.format(nameTemplate, var) + " ";
  }
}
