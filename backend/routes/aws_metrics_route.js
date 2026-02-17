// routes/aws_metrics_route.js
const express = require("express");
const router = express.Router();
const {
  CloudWatchClient,
  GetMetricStatisticsCommand
} = require("@aws-sdk/client-cloudwatch");

const client = new CloudWatchClient({
  region: "ap-southeast-7",
});

// ===== Helper Functions =====

async function getMetric(params) {
  const command = new GetMetricStatisticsCommand(params);
  return await client.send(command);
}

function getLatest(datapoints, key) {
  if (!datapoints || datapoints.length === 0) return null;
  const sorted = datapoints.sort(
    (a, b) => new Date(b.Timestamp) - new Date(a.Timestamp)
  );
  return sorted[0][key];
}

function bytesToGB(bytes) {
  if (!bytes) return 0;
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function bytesToMB(bytes) {
  if (!bytes) return 0;
  return (bytes / 1024 / 1024).toFixed(2);
}

function cpuHealth(cpu) {
  if (cpu === null) return "unknown";
  if (cpu < 70) return "healthy";
  if (cpu < 85) return "warning";
  return "critical";
}

// ===== Route =====

router.get("/metrics/overview", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const promises = await Promise.all([
      // EC2
      getMetric({
        Namespace: "AWS/EC2",
        MetricName: "CPUUtilization",
        Dimensions: [{ Name: "InstanceId", Value: "i-003a55bcb5fbe02dd" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/EC2",
        MetricName: "NetworkIn",
        Dimensions: [{ Name: "InstanceId", Value: "i-003a55bcb5fbe02dd" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Sum"],
      }),
      getMetric({
        Namespace: "AWS/EC2",
        MetricName: "NetworkOut",
        Dimensions: [{ Name: "InstanceId", Value: "i-003a55bcb5fbe02dd" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Sum"],
      }),
      getMetric({
        Namespace: "AWS/EC2",
        MetricName: "StatusCheckFailed",
        Dimensions: [{ Name: "InstanceId", Value: "i-003a55bcb5fbe02dd" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Maximum"],
      }),

      // RDS
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "CPUUtilization",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "DatabaseConnections",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "FreeStorageSpace",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),

      // S3
      getMetric({
        Namespace: "AWS/S3",
        MetricName: "BucketSizeBytes",
        Dimensions: [
          { Name: "BucketName", Value: "trackingweb-s3" },
          { Name: "StorageType", Value: "StandardStorage" }
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 86400,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/S3",
        MetricName: "NumberOfObjects",
        Dimensions: [
          { Name: "BucketName", Value: "trackingweb-s3" },
          { Name: "StorageType", Value: "AllStorageTypes" }
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 86400,
        Statistics: ["Average"],
      })
    ]);

    // ===== Extract Latest Values =====

    const ec2Cpu = getLatest(promises[0].Datapoints, "Average");
    const ec2NetIn = getLatest(promises[1].Datapoints, "Sum");
    const ec2NetOut = getLatest(promises[2].Datapoints, "Sum");
    const ec2Status = getLatest(promises[3].Datapoints, "Maximum");

    const rdsCpu = getLatest(promises[4].Datapoints, "Average");
    const rdsConn = getLatest(promises[5].Datapoints, "Average");
    const rdsStorage = getLatest(promises[6].Datapoints, "Average");

    const s3Size = getLatest(promises[7].Datapoints, "Average");
    const s3Objects = getLatest(promises[8].Datapoints, "Average");

    res.json({
      status: {
        ec2: cpuHealth(ec2Cpu),
        rds: cpuHealth(rdsCpu),
      },
      ec2: {
        cpuPercent: ec2Cpu,
        networkInMB: bytesToMB(ec2NetIn),
        networkOutMB: bytesToMB(ec2NetOut),
        statusCheckFailed: ec2Status,
      },
      rds: {
        cpuPercent: rdsCpu,
        connections: rdsConn,
        freeStorageGB: bytesToGB(rdsStorage),
      },
      s3: {
        bucketSizeGB: bytesToGB(s3Size),
        objectCount: s3Objects,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching metrics" });
  }
});

module.exports = router;
