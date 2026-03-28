const express = require("express");
const router = express.Router();
const {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} = require("@aws-sdk/client-cloudwatch");


const client = new CloudWatchClient({
  region: "ap-southeast-7",
});

/**
 * @swagger
 * tags:
 *   - name: AWSMetrics
 *     description: ดึงข้อมูล Metrics จาก AWS CloudWatch (EC2, RDS, S3)
 *
 * components:
 *   schemas:
 *     EC2Metrics:
 *       type: object
 *       properties:
 *         cpuCurrent:
 *           type: number
 *           description: CPU ปัจจุบัน (%)
 *           example: 32.45
 *         cpuMax:
 *           type: number
 *           description: CPU สูงสุดใน 1 ชั่วโมงที่ผ่านมา (%)
 *           example: 65.10
 *         cpuAvg:
 *           type: number
 *           description: CPU เฉลี่ยใน 1 ชั่วโมงที่ผ่านมา (%)
 *           example: 40.23
 *
 *     RDSMetrics:
 *       type: object
 *       properties:
 *         cpuCurrent:
 *           type: number
 *           description: CPU ปัจจุบัน (%)
 *           example: 18.75
 *         cpuMax:
 *           type: number
 *           description: CPU สูงสุดใน 1 ชั่วโมงที่ผ่านมา (%)
 *           example: 45.00
 *         cpuAvg:
 *           type: number
 *           description: CPU เฉลี่ยใน 1 ชั่วโมงที่ผ่านมา (%)
 *           example: 25.30
 *         connections:
 *           type: number
 *           description: จำนวน Connection ล่าสุด
 *           example: 12
 *         freeStorageGB:
 *           type: number
 *           description: พื้นที่ว่างของ RDS (GB)
 *           example: 18.52
 *
 *     S3Metrics:
 *       type: object
 *       properties:
 *         bucketSizeGB:
 *           type: number
 *           description: ขนาด S3 Bucket (GB)
 *           example: 3.75
 *         objectCount:
 *           type: number
 *           description: จำนวน Object ใน Bucket
 *           example: 1024
 *
 *     HealthStatus:
 *       type: object
 *       properties:
 *         ec2:
 *           type: string
 *           enum: [healthy, warning, critical]
 *           example: "healthy"
 *         rds:
 *           type: string
 *           enum: [healthy, warning, critical]
 *           example: "warning"
 *         system:
 *           type: string
 *           enum: [healthy, warning, critical]
 *           example: "warning"
 *
 *     OverviewResponse:
 *       type: object
 *       properties:
 *         ec2:
 *           $ref: '#/components/schemas/EC2Metrics'
 *         rds:
 *           $ref: '#/components/schemas/RDSMetrics'
 *         s3:
 *           $ref: '#/components/schemas/S3Metrics'
 *         health:
 *           $ref: '#/components/schemas/HealthStatus'
 *         uptimePercent:
 *           type: number
 *           description: เปอร์เซ็นต์ Uptime ของระบบ
 *           example: 100
 *
 *     CPUHistoryPoint:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           description: เวลา (รูปแบบ locale time)
 *           example: "14:30:00"
 *         ec2:
 *           type: number
 *           description: CPU ของ EC2 (%)
 *           example: 35.20
 *         rds:
 *           type: number
 *           description: CPU ของ RDS (%)
 *           example: 20.10
 *
 *     NetworkHistoryPoint:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           description: เวลา (รูปแบบ locale time)
 *           example: "14:30:00"
 *         in:
 *           type: number
 *           description: Network In (MB)
 *           example: 12.50
 *         out:
 *           type: number
 *           description: Network Out (MB)
 *           example: 8.30
 *
 *     HistoryResponse:
 *       type: object
 *       properties:
 *         cpu:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CPUHistoryPoint'
 *         network:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NetworkHistoryPoint'
 *
 *     MetricsErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "overview error"
 */

/**
 * @swagger
 * /api/v1/metrics/overview:
 *   get:
 *     tags: [AWSMetrics]
 *     summary: ดึงข้อมูล Metrics ภาพรวมของระบบ
 *     description: |
 *       ดึงข้อมูล CloudWatch Metrics ย้อนหลัง 1 ชั่วโมง ครอบคลุม
 *       - **EC2**: CPU Utilization และ Status Check
 *       - **RDS**: CPU Utilization, Database Connections, Free Storage
 *       - **S3**: Bucket Size และ Object Count
 *       - **Health**: สถานะสุขภาพของแต่ละ Service
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OverviewResponse'
 *             example:
 *               ec2:
 *                 cpuCurrent: 32.45
 *                 cpuMax: 65.10
 *                 cpuAvg: 40.23
 *               rds:
 *                 cpuCurrent: 18.75
 *                 cpuMax: 45.00
 *                 cpuAvg: 25.30
 *                 connections: 12
 *                 freeStorageGB: 18.52
 *               s3:
 *                 bucketSizeGB: 3.75
 *                 objectCount: 1024
 *               health:
 *                 ec2: "healthy"
 *                 rds: "warning"
 *                 system: "warning"
 *               uptimePercent: 100
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsErrorResponse'
 */

/**
 * @swagger
 * /api/v1/metrics/history:
 *   get:
 *     tags: [AWSMetrics]
 *     summary: ดึงประวัติ Metrics ย้อนหลัง 1 ชั่วโมง
 *     description: |
 *       ดึงข้อมูล CloudWatch Metrics เป็น Time-series ย้อนหลัง 1 ชั่วโมง ทุก 5 นาที ครอบคลุม
 *       - **CPU**: EC2 และ RDS CPU Utilization
 *       - **Network**: Network In / Out ของ EC2 (หน่วย MB)
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryResponse'
 *             example:
 *               cpu:
 *                 - time: "14:00:00"
 *                   ec2: 30.10
 *                   rds: 18.50
 *                 - time: "14:05:00"
 *                   ec2: 35.40
 *                   rds: 20.30
 *               network:
 *                 - time: "14:00:00"
 *                   in: 10.25
 *                   out: 7.80
 *                 - time: "14:05:00"
 *                   in: 12.50
 *                   out: 8.30
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsErrorResponse'
 */


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
