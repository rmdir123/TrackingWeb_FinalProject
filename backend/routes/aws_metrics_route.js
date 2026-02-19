const express = require("express");
const router = express.Router();
const {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} = require("@aws-sdk/client-cloudwatch");

const client = new CloudWatchClient({
  region: "ap-southeast-7",
});

// ================= UTIL =================

async function getMetric(params) {
  const command = new GetMetricStatisticsCommand(params);
  return await client.send(command);
}

function sortByTime(datapoints) {
  return datapoints.sort(
    (a, b) => new Date(a.Timestamp) - new Date(b.Timestamp)
  );
}

function latest(datapoints, key) {
  if (!datapoints.length) return 0;
  const sorted = sortByTime(datapoints);
  return sorted[sorted.length - 1][key] || 0;
}

function maxValue(datapoints, key) {
  if (!datapoints.length) return 0;
  return Math.max(...datapoints.map(d => d[key] || 0));
}

function avgValue(datapoints, key) {
  if (!datapoints.length) return 0;
  const sum = datapoints.reduce((a, b) => a + (b[key] || 0), 0);
  return sum / datapoints.length;
}

function bytesToMB(bytes) {
  return +(bytes / 1024 / 1024).toFixed(2);
}

function bytesToGB(bytes) {
  return +(bytes / 1024 / 1024 / 1024).toFixed(2);
}

function health(cpu) {
  if (cpu < 70) return "healthy";
  if (cpu < 85) return "warning";
  return "critical";
}

function overallHealth(...statuses) {
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "healthy";
}

// ======================================================
// ================== OVERVIEW ===========================
// ======================================================

router.get("/metrics/overview", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [
      ec2CpuRes,
      ec2StatusRes,
      rdsCpuRes,
      rdsConnRes,
      rdsStorageRes,
      s3SizeRes,
      s3ObjectRes,
    ] = await Promise.all([
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
        MetricName: "StatusCheckFailed",
        Dimensions: [{ Name: "InstanceId", Value: "i-003a55bcb5fbe02dd" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Maximum"],
      }),
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "CPUUtilization",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web-private" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "DatabaseConnections",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web-private" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/RDS",
        MetricName: "FreeStorageSpace",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web-private" }],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 300,
        Statistics: ["Average"],
      }),
      getMetric({
        Namespace: "AWS/S3",
        MetricName: "BucketSizeBytes",
        Dimensions: [
          { Name: "BucketName", Value: "trackingweb-s3" },
          { Name: "StorageType", Value: "StandardStorage" },
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
          { Name: "StorageType", Value: "AllStorageTypes" },
        ],
        StartTime: oneHourAgo,
        EndTime: now,
        Period: 86400,
        Statistics: ["Average"],
      }),
    ]);

    const ec2CpuLatest = latest(ec2CpuRes.Datapoints, "Average");
    const rdsCpuLatest = latest(rdsCpuRes.Datapoints, "Average");

    const ec2Health = health(ec2CpuLatest);
    const rdsHealth = health(rdsCpuLatest);
    const systemHealth = overallHealth(ec2Health, rdsHealth);

    const statusCheckMax = maxValue(ec2StatusRes.Datapoints, "Maximum");
    const uptime = statusCheckMax === 0 ? 100 : 99;

    res.json({
      ec2: {
        cpuCurrent: +ec2CpuLatest.toFixed(2),
        cpuMax: +maxValue(ec2CpuRes.Datapoints, "Average").toFixed(2),
        cpuAvg: +avgValue(ec2CpuRes.Datapoints, "Average").toFixed(2),
      },
      rds: {
        cpuCurrent: +rdsCpuLatest.toFixed(2),
        cpuMax: +maxValue(rdsCpuRes.Datapoints, "Average").toFixed(2),
        cpuAvg: +avgValue(rdsCpuRes.Datapoints, "Average").toFixed(2),
        connections: latest(rdsConnRes.Datapoints, "Average"),
        freeStorageGB: bytesToGB(
          latest(rdsStorageRes.Datapoints, "Average")
        ),
      },
      s3: {
        bucketSizeGB: bytesToGB(
          latest(s3SizeRes.Datapoints, "Average")
        ),
        objectCount: latest(s3ObjectRes.Datapoints, "Average"),
      },
      health: {
        ec2: ec2Health,
        rds: rdsHealth,
        system: systemHealth,
      },
      uptimePercent: uptime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "overview error" });
  }
});

// ======================================================
// ================== HISTORY ===========================
// ======================================================

router.get("/metrics/history", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [ec2Cpu, rdsCpu, netIn, netOut] = await Promise.all([
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
        Namespace: "AWS/RDS",
        MetricName: "CPUUtilization",
        Dimensions: [{ Name: "DBInstanceIdentifier", Value: "db-web" }],
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
    ]);

    const ec2Sorted = sortByTime(ec2Cpu.Datapoints);
    const rdsSorted = sortByTime(rdsCpu.Datapoints);
    const netInSorted = sortByTime(netIn.Datapoints);
    const netOutSorted = sortByTime(netOut.Datapoints);

    const cpuData = ec2Sorted.map((point) => {
      const matchRds = rdsSorted.find(
        (r) =>
          new Date(r.Timestamp).getTime() ===
          new Date(point.Timestamp).getTime()
      );

      return {
        time: new Date(point.Timestamp).toLocaleTimeString(),
        ec2: +point.Average.toFixed(2),
        rds: matchRds ? +matchRds.Average.toFixed(2) : 0,
      };
    });

    const networkData = netInSorted.map((point) => {
      const matchOut = netOutSorted.find(
        (o) =>
          new Date(o.Timestamp).getTime() ===
          new Date(point.Timestamp).getTime()
      );

      return {
        time: new Date(point.Timestamp).toLocaleTimeString(),
        in: bytesToMB(point.Sum),
        out: matchOut ? bytesToMB(matchOut.Sum) : 0,
      };
    });

    res.json({
      cpu: cpuData,
      network: networkData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "history error" });
  }
});


module.exports = router;
