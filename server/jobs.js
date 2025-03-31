const { UptimeKumaServer } = require("./uptime-kuma-server");
const { clearOldData } = require("./jobs/clear-old-data");
const { incrementalVacuum } = require("./jobs/incremental-vacuum");
const { CronJob } = require('cron');
const { log } = require("../src/util");

const jobs = [
    {
        name: "clear-old-data",
        interval: "14 03 * * *",
        jobFunc: clearOldData,
        croner: null,
    },
    {
        name: "incremental-vacuum",
        interval: "*/5 * * * *",
        jobFunc: incrementalVacuum,
        croner: null,
    }
];

/**
 * Initialize background jobs
 * @returns {Promise<void>}
 */
const initBackgroundJobs = async function () {
    try {
        const timezone = await UptimeKumaServer.getInstance().getTimezone();

        if (!timezone) {
            throw new Error("Timezone is not defined or invalid.");
        }

        for (const job of jobs) {
            try {
                log.info("jobs", `Initializing job: ${job.name}`);
                const cronJob = new CronJob(
                    job.interval,
                    job.jobFunc,
                    null,
                    false,
                    timezone
                );
                cronJob.start();
                job.croner = cronJob;
                log.info("jobs", `Job '${job.name}' initialized successfully.`);
            } catch (err) {
                log.error("jobs", `Failed to initialize job '${job.name}': ${err.message}`);
            }
        }
    } catch (err) {
        log.error("jobs", `Error initializing background jobs: ${err.message}`);
    }
};

/**
 * Stop all background jobs if running
 * @returns {void}
 */
const stopBackgroundJobs = function () {
    for (const job of jobs) {
        if (job.croner) {
            try {
                log.info("jobs", `Stopping job: ${job.name}`);
                job.croner.stop();
                job.croner = null;
                log.info("jobs", `Job '${job.name}' stopped successfully.`);
            } catch (err) {
                log.error("jobs", `Failed to stop job '${job.name}': ${err.message}`);
            }
        }
    }
};

module.exports = {
    initBackgroundJobs,
    stopBackgroundJobs
};
