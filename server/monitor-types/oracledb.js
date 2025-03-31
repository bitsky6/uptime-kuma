const { MonitorType } = require("./monitor-type");
const oracledb = require("oracledb");
const { log } = require("../../src/util");

class OracleDBMonitorType extends MonitorType {
    name = "oracledb";
    supportsConditions = true;
    conditionVariables = [
        {
            name: "status",
            description: "Database status (up/down)",
        },
        {
            name: "response_time",
            description: "Response time in milliseconds",
        },
    ];

    async check(monitor, heartbeat, server) {

        let user, password, connectString;
        if (monitor.oracleDatabaseUser && monitor.oracleDatabasePassword && monitor.databaseConnectionString) {
            user = monitor.oracleDatabaseUser;
            password = monitor.oracleDatabasePassword;
            connectString = monitor.databaseConnectionString;
        } else {
            heartbeat.status = "down";
            heartbeat.msg = "Missing OracleDB connection parameters (user, password, connection string).";
            return;
        }

        log.debug("ORACLEDB","OracleDB connection parameters:", {
            user,
            password: password ? "********" : password,
            connectString: connectString.trim()
        });

        // Convert JDBC string if necessary
        let cleanConnectString = connectString.trim();
        const jdbcPrefix1 = "jdbc:oracle:thin:@//";
        const jdbcPrefix2 = "jdbc:oracle:thin:@";

        if (cleanConnectString.startsWith(jdbcPrefix1)) {
            cleanConnectString = cleanConnectString.substring(jdbcPrefix1.length);
        } else if (cleanConnectString.startsWith(jdbcPrefix2)) {
            cleanConnectString = cleanConnectString.substring(jdbcPrefix2.length);
        }

        // If the resulting string does not start with a slash or a parenthesis, prepend '//'
        if (!cleanConnectString.startsWith('//') && !cleanConnectString.startsWith('(')) {
            cleanConnectString = '//' + cleanConnectString;
        }

        log.debug("ORACLEDB","Final connection string:", cleanConnectString);

        try {
            const startTime = Date.now();
            const connection = await oracledb.getConnection({
                user,
                password,
                connectString: cleanConnectString
            });
            await connection.execute("SELECT 1 FROM DUAL");
            await connection.close();
            const responseTime = Date.now() - startTime;

            heartbeat.status = "up";
            heartbeat.msg = "OracleDB is healthy";
            heartbeat.ping = responseTime;
        } catch (error) {
            log.info("OracleDB connection error:", error);
            heartbeat.status = "down";
            heartbeat.msg = error.message;
        }
    }
}

module.exports = OracleDBMonitorType;
