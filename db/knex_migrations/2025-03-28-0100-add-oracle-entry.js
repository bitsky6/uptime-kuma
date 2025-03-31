exports.up = function(knex) {
  return knex.schema.alterTable("monitor", function(table) {
    table.string("oracle_database_user", 255);
    table.string("oracle_database_password", 255);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("monitor", function(table) {
    table.dropColumn("oracle_database_user");
    table.dropColumn("oracle_database_password");
  });
};
